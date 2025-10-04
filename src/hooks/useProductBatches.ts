import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  purchase_order_id: string | null;
  received_date: string;
  expiry_date: string | null;
  quantity: number;
  unit_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useProductBatches = (productId?: string) => {
  return useQuery({
    queryKey: ['product-batches', productId],
    queryFn: async () => {
      let query = supabase
        .from('product_batches')
        .select('*')
        .order('received_date', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductBatch[];
    },
  });
};

// Batches expirés ou proches de l'expiration
export const useExpiringBatches = (days: number = 30) => {
  return useQuery({
    queryKey: ['expiring-batches', days],
    queryFn: async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const { data, error } = await supabase
        .from('product_batches')
        .select(`
          *,
          products (name, barcode)
        `)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .gt('quantity', 0)
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateProductBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batch: Partial<ProductBatch>) => {
      const { error } = await supabase
        .from('product_batches')
        .insert([batch]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-batches'] });
      toast.success('Lot créé');
    },
    onError: (error: Error) => {
      console.error('Error creating batch:', error);
      toast.error('Erreur lors de la création');
    },
  });
};

export const useUpdateBatchQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('product_batches')
        .update({ quantity })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-batches'] });
      toast.success('Quantité mise à jour');
    },
    onError: (error: Error) => {
      console.error('Error updating batch quantity:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
};
