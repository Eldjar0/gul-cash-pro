import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: 'pending' | 'ready' | 'completed' | 'cancelled';
  order_date: string;
  ready_date: string | null;
  completed_date: string | null;
  subtotal: number;
  total_vat: number;
  total: number;
  deposit_paid: number;
  remaining_balance: number | null;
  notes: string | null;
  notified: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerOrderItem {
  id: string;
  customer_order_id: string;
  product_id: string | null;
  product_name: string;
  product_barcode: string | null;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  created_at: string;
}

export const useCustomerOrders = (status?: CustomerOrder['status']) => {
  return useQuery({
    queryKey: ['customer-orders', status],
    queryFn: async () => {
      let query = supabase
        .from('customer_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CustomerOrder[];
    },
  });
};

export const useCustomerOrdersByCustomerId = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-orders-by-customer', customerId],
    queryFn: async () => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerOrder[];
    },
    enabled: !!customerId,
  });
};

export const useCustomerOrderDetails = (id?: string) => {
  return useQuery({
    queryKey: ['customer-order', id],
    queryFn: async () => {
      if (!id) throw new Error('ID required');

      const { data, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          customer_order_items (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateCustomerOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: Partial<CustomerOrder> & { items: Partial<CustomerOrderItem>[] }) => {
      const { data: orderNumber, error: fnError } = await supabase.rpc('generate_customer_order_number');
      if (fnError) throw fnError;

      const { items, ...orderData } = order;

      // Générer automatiquement order_number
      const generatedOrderNumber = orderNumber as unknown as string;

      const { data: newOrder, error: orderError } = await supabase
        .from('customer_orders')
        .insert({ 
          order_number: generatedOrderNumber,
          customer_id: orderData.customer_id || null,
          status: orderData.status || 'pending',
          subtotal: orderData.subtotal!,
          total_vat: orderData.total_vat!,
          total: orderData.total!,
          deposit_paid: orderData.deposit_paid || 0,
          remaining_balance: orderData.total! - (orderData.deposit_paid || 0),
          notes: orderData.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsWithOrderId = items.map(item => ({
        customer_order_id: newOrder.id,
        product_id: item.product_id,
        product_name: item.product_name!,
        product_barcode: item.product_barcode,
        quantity: item.quantity!,
        unit_price: item.unit_price!,
        vat_rate: item.vat_rate!,
        subtotal: item.subtotal!,
        vat_amount: item.vat_amount!,
        total: item.total!,
      }));

      const { error: itemsError } = await supabase
        .from('customer_order_items')
        .insert(itemsWithOrderId);

      if (itemsError) throw itemsError;

      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      toast.success('Commande créée');
    },
    onError: (error: Error) => {
      console.error('Error creating customer order:', error);
      toast.error('Erreur lors de la création');
    },
  });
};

export const useUpdateCustomerOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CustomerOrder['status'] }) => {
      const update: any = { status };

      if (status === 'ready') {
        update.ready_date = new Date().toISOString().split('T')[0];
      } else if (status === 'completed') {
        update.completed_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('customer_orders')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-order'] });
      toast.success('Statut mis à jour');
    },
    onError: (error: Error) => {
      console.error('Error updating order status:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
};
