import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  type: 'unit' | 'weight';
  unit?: string; // unité, carton, lot, kg, g, litre, ml, etc.
  category_id?: string;
  vat_rate: number;
  stock?: number;
  min_stock?: number;
  supplier?: string;
  image?: string;
  is_active: boolean;
}

export const useProducts = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useProductsByCategory = (categoryId?: string) => {
  return useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as Product[];
    },
    enabled: categoryId !== undefined,
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produit créé',
        description: 'Le produit a été créé avec succès.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: "Impossible de créer le produit.",
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produit mis à jour',
        description: 'Le produit a été mis à jour avec succès.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le produit.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été désactivé.',
      });
    },
  });
};

export const useSearchProducts = (search: string) => {
  return useQuery({
    queryKey: ['products', 'search', search],
    queryFn: async () => {
      const trimmedSearch = search.trim();
      
      // Check if search is a number (for price search)
      const isNumber = !isNaN(Number(trimmedSearch)) && trimmedSearch !== '';
      
      // Check if search looks like a UUID (for ID search)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedSearch);
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      
      // Build search conditions
      const conditions = [];
      
      // Always search in name and barcode
      conditions.push(`name.ilike.%${trimmedSearch}%`);
      conditions.push(`barcode.ilike.%${trimmedSearch}%`);
      
      // If it's a number, also search by price
      if (isNumber) {
        const numValue = Number(trimmedSearch);
        conditions.push(`price.eq.${numValue}`);
      }
      
      // If it's a UUID, also search by ID
      if (isUUID) {
        conditions.push(`id.eq.${trimmedSearch}`);
      }
      
      query = query.or(conditions.join(','));
      
      const { data, error } = await query
        .order('name')
        .limit(20);

      if (error) throw error;
      return data as Product[];
    },
    enabled: search.length > 0,
  });
};
