import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InventoryCount {
  id: string;
  count_number: string;
  count_date: string;
  status: 'in_progress' | 'completed' | 'validated';
  counted_by: string | null;
  validated_by: string | null;
  notes: string | null;
  total_variance_value: number;
  created_at: string;
  completed_at: string | null;
}

export interface InventoryCountItem {
  id: string;
  inventory_count_id: string;
  product_id: string;
  product_name: string;
  product_barcode: string | null;
  expected_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  unit_cost: number | null;
  variance_value: number | null;
  notes: string | null;
  created_at: string;
}

export const useInventoryCounts = () => {
  return useQuery({
    queryKey: ['inventory-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_counts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InventoryCount[];
    },
  });
};

export const useInventoryCountDetails = (id?: string) => {
  return useQuery({
    queryKey: ['inventory-count', id],
    queryFn: async () => {
      if (!id) throw new Error('ID required');

      const { data, error } = await supabase
        .from('inventory_counts')
        .select(`
          *,
          inventory_count_items (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateInventoryCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: countNumber, error: fnError } = await supabase.rpc('generate_inventory_count_number');
      if (fnError) throw fnError;

      const { data: newCount, error: countError } = await supabase
        .from('inventory_counts')
        .insert({ count_number: countNumber })
        .select()
        .single();

      if (countError) throw countError;

      // Récupérer tous les produits actifs et créer les items
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, barcode, stock, cost_price')
        .eq('is_active', true);

      if (prodError) throw prodError;

      const items = products.map(p => ({
        inventory_count_id: newCount.id,
        product_id: p.id,
        product_name: p.name,
        product_barcode: p.barcode,
        expected_quantity: p.stock || 0,
        unit_cost: p.cost_price,
      }));

      const { error: itemsError } = await supabase
        .from('inventory_count_items')
        .insert(items);

      if (itemsError) throw itemsError;

      return newCount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
      toast.success('Inventaire créé');
    },
    onError: (error: Error) => {
      console.error('Error creating inventory count:', error);
      toast.error('Erreur lors de la création');
    },
  });
};

export const useUpdateCountedQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      // Récupérer l'item pour calculer variance
      const { data: item, error: fetchError } = await supabase
        .from('inventory_count_items')
        .select('expected_quantity, unit_cost')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const variance = quantity - item.expected_quantity;
      const variance_value = variance * (item.unit_cost || 0);

      const { error } = await supabase
        .from('inventory_count_items')
        .update({ 
          counted_quantity: quantity,
          variance,
          variance_value,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-count'] });
      toast.success('Quantité enregistrée');
    },
    onError: (error: Error) => {
      console.error('Error updating counted quantity:', error);
      toast.error('Erreur lors de l\'enregistrement');
    },
  });
};

export const useCompleteInventoryCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (countId: string) => {
      const { error } = await supabase
        .from('inventory_counts')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', countId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-count'] });
      toast.success('Inventaire terminé');
    },
    onError: (error: Error) => {
      console.error('Error completing inventory:', error);
      toast.error('Erreur lors de la finalisation');
    },
  });
};
