import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HeldTicket {
  id: string;
  ticket_number: string;
  items: any[];
  total_amount: number;
  created_at: string;
  item_count: number;
}

// Hook pour obtenir les tickets en attente
export const useHeldTickets = () => {
  return useQuery({
    queryKey: ['held-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobile_orders')
        .select('*')
        .eq('status', 'held')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((order: any, index: number) => {
        const items = Array.isArray(order.items) ? order.items : [];
        return {
          id: order.id,
          ticket_number: order.notes || `Ticket #${index + 1}`,
          items: items,
          total_amount: order.total_amount || 0,
          created_at: order.created_at,
          item_count: items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0),
        };
      }) as HeldTicket[];
    },
  });
};

// Hook pour mettre un ticket en attente
export const useHoldTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartData }: { cartData: any[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate order number
      const { data: orderNumber, error: fnError } = await supabase.rpc('generate_mobile_order_number');
      if (fnError) throw fnError;

      // Generate ticket name with time
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      // Count existing held tickets to generate number
      const { count } = await supabase
        .from('mobile_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'held');
      
      const ticketName = `Ticket #${(count || 0) + 1} - ${timeStr}`;

      // Transform cart data to mobile order items format
      const items = cartData.map((item: any) => ({
        product_id: item.product?.id,
        product_name: item.product?.name,
        quantity: item.quantity,
        unit_price: item.custom_price ?? item.product?.price,
        total_price: item.total,
        vat_rate: item.product?.vat_rate || 21,
        discount: item.discount,
        is_gift: item.is_gift,
      }));

      const total = items.reduce((sum: number, item: any) => sum + item.total_price, 0);

      const { error } = await supabase
        .from('mobile_orders')
        .insert({
          order_number: orderNumber as string,
          status: 'held',
          items: items,
          total_amount: total,
          notes: ticketName,
          created_by: user.id,
        });

      if (error) throw error;
      
      return ticketName;
    },
    onSuccess: (ticketName) => {
      queryClient.invalidateQueries({ queryKey: ['held-tickets'] });
      toast.success(`${ticketName} mis en attente`);
    },
    onError: (error: Error) => {
      console.error('Error holding ticket:', error);
      toast.error('Erreur lors de la mise en attente');
    },
  });
};

// Hook pour reprendre un ticket en attente
export const useResumeTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      // Get the ticket data
      const { data, error } = await supabase
        .from('mobile_orders')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      
      // Delete the held ticket
      const { error: deleteError } = await supabase
        .from('mobile_orders')
        .delete()
        .eq('id', ticketId);

      if (deleteError) throw deleteError;
      
      // Transform to Cart format expected by Index.tsx
      const items = Array.isArray(data.items) ? data.items : [];
      
      // Fetch full product details for each item
      const productIds = items.map((item: any) => item.product_id).filter(Boolean);
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      
      return items.map((item: any) => {
        const product = productsMap.get(item.product_id);
        const vatRate = item.vat_rate || product?.vat_rate || 21;
        const unitPrice = item.unit_price || product?.price || 0;
        const quantity = item.quantity || 1;
        const subtotal = (unitPrice * quantity) / (1 + vatRate / 100);
        const vatAmount = (unitPrice * quantity) - subtotal;
        
        return {
          product: product ? {
            ...product,
            vat_rate: vatRate,
          } : {
            id: item.product_id,
            name: item.product_name,
            price: unitPrice,
            barcode: '',
            type: 'unit' as const,
            vat_rate: vatRate,
            stock: 0,
          },
          quantity: quantity,
          custom_price: item.unit_price !== product?.price ? item.unit_price : undefined,
          discount: item.discount,
          is_gift: item.is_gift,
          subtotal: subtotal,
          vatAmount: vatAmount,
          total: item.total_price || unitPrice * quantity,
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['held-tickets'] });
      toast.success('Ticket repris');
    },
    onError: (error: Error) => {
      console.error('Error resuming ticket:', error);
      toast.error('Erreur lors de la reprise du ticket');
    },
  });
};

// Hook pour supprimer un ticket en attente
export const useDeleteHeldTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('mobile_orders')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['held-tickets'] });
      toast.success('Ticket supprimé');
    },
    onError: (error: Error) => {
      console.error('Error deleting held ticket:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
};
