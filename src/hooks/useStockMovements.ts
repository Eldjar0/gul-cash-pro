import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StockMovement {
  id: string;
  product_id: string | null;
  product_name: string;
  product_barcode: string | null;
  movement_type: 'in' | 'out' | 'adjustment' | 'sale' | 'refund' | 'damage' | 'transfer';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  reference_id: string | null;
  reference_type: string | null;
  user_id: string | null;
  notes: string | null;
  created_at: string;
}

export const useStockMovements = (productId?: string) => {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as StockMovement[];
    },
  });
};

export type CreateStockMovement = Omit<StockMovement, 'id' | 'created_at'>;

export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: CreateStockMovement) => {
      const { error } = await supabase
        .from('stock_movements')
        .insert([movement]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
    onError: (error: Error) => {
      console.error('Error creating stock movement:', error);
      toast.error('Erreur lors de l\'enregistrement du mouvement');
    },
  });
};

export const useStockMovementsByDate = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['stock-movements-by-date', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StockMovement[];
    },
  });
};
