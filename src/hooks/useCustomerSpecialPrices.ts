import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerSpecialPrice {
  id: string;
  customer_id: string;
  product_id: string;
  special_price: number;
  created_at: string;
  products?: {
    id: string;
    name: string;
    barcode: string;
    price: number;
  };
}

export const useCustomerSpecialPrices = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-special-prices', customerId],
    queryFn: async () => {
      const query = supabase
        .from('customer_special_prices')
        .select('*, products(id, name, barcode, price)')
        .order('created_at', { ascending: false });
      
      if (customerId) {
        query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as CustomerSpecialPrice[];
    },
    enabled: !!customerId,
  });
};

export const useCreateCustomerSpecialPrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      customer_id: string;
      product_id: string;
      special_price: number;
    }) => {
      const { error } = await supabase
        .from('customer_special_prices')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-special-prices'] });
      toast.success('Prix spécial ajouté');
    },
    onError: (error) => {
      console.error('Error creating special price:', error);
      toast.error('Erreur lors de l\'ajout du prix spécial');
    },
  });
};

export const useUpdateCustomerSpecialPrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, special_price }: { id: string; special_price: number }) => {
      const { error } = await supabase
        .from('customer_special_prices')
        .update({ special_price })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-special-prices'] });
      toast.success('Prix spécial mis à jour');
    },
    onError: (error) => {
      console.error('Error updating special price:', error);
      toast.error('Erreur lors de la mise à jour du prix spécial');
    },
  });
};

export const useDeleteCustomerSpecialPrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_special_prices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-special-prices'] });
      toast.success('Prix spécial supprimé');
    },
    onError: (error) => {
      console.error('Error deleting special price:', error);
      toast.error('Erreur lors de la suppression du prix spécial');
    },
  });
};

export const getSpecialPriceForCustomer = async (customerId: string, productId: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from('customer_special_prices')
    .select('special_price')
    .eq('customer_id', customerId)
    .eq('product_id', productId)
    .maybeSingle();
  
  if (error || !data) return null;
  return data.special_price;
};
