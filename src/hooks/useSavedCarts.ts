import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SavedCart {
  id: string;
  cashier_id: string;
  cart_name: string;
  cart_data: any;
  created_at: string;
  updated_at: string;
  total_amount?: number;
  customer_name?: string;
}

// Hook pour obtenir les paniers sauvegardés (utilise mobile_orders)
export const useSavedCarts = () => {
  return useQuery({
    queryKey: ['saved-carts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobile_orders')
        .select('*')
        .eq('status', 'pending')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform mobile_orders to SavedCart format
      return (data || []).map((order: any) => {
        const items = Array.isArray(order.items) ? order.items : [];
        return {
          id: order.id,
          cashier_id: order.created_by,
          cart_name: order.notes || order.order_number,
          cart_data: items.map((item: any) => ({
            product_id: item.product_id,
            name: item.product_name,
            quantity: item.quantity,
            price: item.unit_price,
            vat_rate: 21,
            subtotal: item.total_price,
            vat_amount: item.total_price * 0.21 / 1.21,
            total: item.total_price,
          })),
          created_at: order.created_at,
          updated_at: order.updated_at,
          total_amount: order.total_amount,
          customer_name: order.customer_name,
        };
      }) as SavedCart[];
    },
  });
};

// Hook pour sauvegarder un panier (utilise mobile_orders)
export const useSaveCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartName, cartData }: { cartName: string; cartData: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate order number
      const { data: orderNumber, error: fnError } = await supabase.rpc('generate_mobile_order_number');
      if (fnError) throw fnError;

      // Transform cart data to mobile order items format
      const items = cartData.map((item: any) => ({
        product_id: item.product?.id || item.product_id,
        product_name: item.product?.name || item.name,
        quantity: item.quantity,
        unit_price: item.product?.price || item.price,
        total_price: item.total || item.subtotal,
      }));

      const total = items.reduce((sum: number, item: any) => sum + item.total_price, 0);

      const { error } = await supabase
        .from('mobile_orders')
        .insert({
          order_number: orderNumber as string,
          status: 'pending',
          items: items,
          total_amount: total,
          notes: cartName,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-carts'] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      toast.success('Panier sauvegardé avec succès');
    },
    onError: (error: Error) => {
      console.error('Error saving cart:', error);
      toast.error('Erreur lors de la sauvegarde du panier');
    },
  });
};

// Hook pour charger un panier sauvegardé (utilise mobile_orders)
export const useLoadCart = () => {
  return useMutation({
    mutationFn: async (cartId: string) => {
      const { data, error } = await supabase
        .from('mobile_orders')
        .select('*')
        .eq('id', cartId)
        .single();

      if (error) throw error;
      
      // Transform to Cart format expected by Index.tsx
      const items = Array.isArray(data.items) ? data.items : [];
      
      // Fetch full product details for each item
      const productIds = items.map((item: any) => item.product_id).filter(Boolean);
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      
      return {
        id: data.id,
        cashier_id: data.created_by,
        cart_name: data.notes || data.order_number,
        cart_data: items.map((item: any) => {
          const product = productsMap.get(item.product_id);
          if (!product) {
            // Fallback: create minimal product object from stored data
            return {
              product: {
                id: item.product_id,
                name: item.product_name,
                price: item.unit_price,
                barcode: '',
                type: 'unit' as const,
                vat: 21,
                stock: 0,
              },
              quantity: item.quantity,
              subtotal: item.total_price / 1.21,
              vatAmount: item.total_price * 0.21 / 1.21,
              total: item.total_price,
            };
          }
          
          return {
            product: {
              id: product.id,
              barcode: product.barcode || '',
              name: product.name,
              price: item.unit_price, // Use saved price, not current price
              type: product.type,
              category: product.category_id,
              stock: product.stock,
              vat: product.vat_rate,
              image: product.image,
            },
            quantity: item.quantity,
            subtotal: item.total_price / 1.21,
            vatAmount: item.total_price * 0.21 / 1.21,
            total: item.total_price,
          };
        }),
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as SavedCart;
    },
    onSuccess: () => {
      toast.success('Panier chargé avec succès');
    },
    onError: (error: Error) => {
      console.error('Error loading cart:', error);
      toast.error('Erreur lors du chargement du panier');
    },
  });
};

// Hook pour supprimer un panier sauvegardé (utilise mobile_orders)
export const useDeleteSavedCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await supabase
        .from('mobile_orders')
        .delete()
        .eq('id', cartId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-carts'] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      toast.success('Panier supprimé avec succès');
    },
    onError: (error: Error) => {
      console.error('Error deleting cart:', error);
      toast.error('Erreur lors de la suppression du panier');
    },
  });
};