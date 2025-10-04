import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MobileOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface MobileOrder {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  items: MobileOrderItem[];
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useMobileOrders = (status?: 'pending' | 'completed' | 'cancelled') => {
  return useQuery({
    queryKey: ['mobile-orders', status],
    queryFn: async () => {
      let query = supabase
        .from('mobile_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as MobileOrder[];
    },
    staleTime: 30000,
  });
};

export const useMobileOrder = (id?: string) => {
  return useQuery({
    queryKey: ['mobile-order', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('mobile_orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as MobileOrder | null;
    },
    enabled: !!id,
  });
};

export const useCreateMobileOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: Omit<MobileOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'created_by'>) => {
      // Generate order number
      const { data: orderNumber, error: numberError } = await supabase
        .rpc('generate_mobile_order_number');

      if (numberError) throw numberError;

      const { data, error } = await supabase
        .from('mobile_orders')
        .insert({
          ...orderData,
          order_number: orderNumber,
          items: orderData.items as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as MobileOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-orders'] });
      toast.success('Commande créée avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating mobile order:', error);
      toast.error('Erreur lors de la création de la commande');
    },
  });
};

export const useUpdateMobileOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MobileOrder> & { id: string }) => {
      const updateData = updates.items ? { ...updates, items: updates.items as any } : updates;
      
      const { data, error} = await supabase
        .from('mobile_orders')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as MobileOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-orders'] });
      toast.success('Commande mise à jour');
    },
    onError: (error: any) => {
      console.error('Error updating mobile order:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
};

export const useDeleteMobileOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mobile_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-orders'] });
      toast.success('Commande supprimée');
    },
    onError: (error: any) => {
      console.error('Error deleting mobile order:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
};