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
      // Validation des données
      if (!product.name || typeof product.name !== 'string' || product.name.trim().length === 0) {
        throw new Error('Le nom du produit est requis');
      }
      
      if (typeof product.price !== 'number' || isNaN(product.price) || product.price < 0) {
        throw new Error('Le prix doit être un nombre positif');
      }
      
      if (typeof product.vat_rate !== 'number' || isNaN(product.vat_rate) || product.vat_rate < 0 || product.vat_rate > 100) {
        throw new Error('Le taux de TVA doit être entre 0 et 100%');
      }

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
    onError: (error: any) => {
      let description = "Impossible de créer le produit.";
      
      // Handle duplicate barcode error
      if (error?.message?.includes('duplicate key') && error?.message?.includes('barcode')) {
        description = "Ce code-barres existe déjà. Veuillez en utiliser un autre.";
      } else if (error?.message) {
        description = error.message;
      }
      
      toast({
        title: 'Erreur',
        description,
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
    onError: (error: any) => {
      let description = 'Impossible de mettre à jour le produit.';
      
      // Handle duplicate barcode error
      if (error?.message?.includes('duplicate key') && error?.message?.includes('barcode')) {
        description = "Ce code-barres existe déjà. Veuillez en utiliser un autre.";
      } else if (error?.message) {
        description = error.message;
      }
      
      toast({
        title: 'Erreur',
        description,
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
      
      // First try exact barcode match in product_barcodes table
      const { data: barcodeMatch, error: barcodeError } = await supabase
        .from('product_barcodes')
        .select('product_id')
        .eq('barcode', trimmedSearch)
        .limit(1);

      if (barcodeError) throw barcodeError;

      if (barcodeMatch && barcodeMatch.length > 0) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', barcodeMatch[0].product_id)
          .eq('is_active', true)
          .maybeSingle();

        if (productError) throw productError;
        if (product) return [product];
      }

      // If no exact barcode match, do fuzzy search
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
      
      // Always search in name
      conditions.push(`name.ilike.%${trimmedSearch}%`);
      
      // If it's a number, also search by price
      if (isNumber) {
        const numValue = Number(trimmedSearch);
        conditions.push(`price.eq.${numValue}`);
      }
      
      // If it's a UUID, also search by ID
      if (isUUID) {
        conditions.push(`id.eq.${trimmedSearch}`);
      }

      // Search in product_barcodes table for fuzzy barcode matches
      const { data: fuzzyBarcodes } = await supabase
        .from('product_barcodes')
        .select('product_id')
        .ilike('barcode', `%${trimmedSearch}%`)
        .limit(20);

      if (fuzzyBarcodes && fuzzyBarcodes.length > 0) {
        const productIds = fuzzyBarcodes.map(b => b.product_id);
        conditions.push(`id.in.(${productIds.join(',')})`);
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

export interface AdvancedSearchParams {
  searchTerm?: string;
  priceMin?: number;
  priceMax?: number;
  supplier?: string;
  categoryId?: string;
  stockMin?: number;
  stockMax?: number;
  type?: 'unit' | 'weight';
}

export const useAdvancedSearchProducts = (params: AdvancedSearchParams) => {
  const { searchTerm, priceMin, priceMax, supplier, categoryId, stockMin, stockMax, type } = params;
  
  return useQuery({
    queryKey: ['products', 'advanced-search', params],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Search by name or barcode
      if (searchTerm && searchTerm.trim()) {
        const trimmed = searchTerm.trim();
        query = query.or(`name.ilike.%${trimmed}%,barcode.ilike.%${trimmed}%`);
      }

      // Filter by price range
      if (priceMin !== undefined && priceMin > 0) {
        query = query.gte('price', priceMin);
      }
      if (priceMax !== undefined && priceMax > 0) {
        query = query.lte('price', priceMax);
      }

      // Filter by supplier
      if (supplier && supplier.trim()) {
        query = query.ilike('supplier', `%${supplier.trim()}%`);
      }

      // Filter by category
      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }

      // Filter by stock range
      if (stockMin !== undefined) {
        query = query.gte('stock', stockMin);
      }
      if (stockMax !== undefined) {
        query = query.lte('stock', stockMax);
      }

      // Filter by type
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query
        .order('name')
        .limit(100);

      if (error) throw error;
      return data as Product[];
    },
    enabled: true,
    staleTime: 30000,
  });
};
