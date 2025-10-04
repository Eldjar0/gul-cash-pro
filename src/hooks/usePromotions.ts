import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Promotion {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number;
  min_purchase?: number;
  applicable_products?: string[];
  applicable_categories?: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'promotions')
        .maybeSingle();

      if (data?.value) {
        return (data.value as any).promotions as Promotion[];
      }

      return [];
    },
  });
};

export const useSavePromotions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotions: Promotion[]) => {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'promotions',
          value: { promotions } as any,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotions enregistrées');
    },
    onError: (error: Error) => {
      console.error('Error saving promotions:', error);
      toast.error('Erreur lors de l\'enregistrement');
    },
  });
};

export const useActivePromotions = () => {
  return useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'promotions')
        .maybeSingle();

      if (!data?.value) return [];

      const promotions = (data.value as any).promotions as Promotion[];
      const now = new Date();

      return promotions.filter(promo => 
        promo.is_active &&
        new Date(promo.start_date) <= now &&
        new Date(promo.end_date) >= now
      );
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

export const calculateDiscount = (
  cartItems: any[],
  promotions: Promotion[],
  categories: any[]
): { discount: number; appliedPromo: Promotion | null } => {
  let bestDiscount = 0;
  let appliedPromo: Promotion | null = null;

  const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  for (const promo of promotions) {
    let discount = 0;

    // Check minimum purchase requirement
    if (promo.min_purchase && cartTotal < promo.min_purchase) {
      continue;
    }

    switch (promo.type) {
      case 'percentage':
        if (promo.applicable_products && promo.applicable_products.length > 0) {
          // Discount on specific products
          const eligibleTotal = cartItems
            .filter(item => promo.applicable_products?.includes(item.product_id))
            .reduce((sum, item) => sum + item.total, 0);
          discount = (eligibleTotal * promo.value) / 100;
        } else if (promo.applicable_categories && promo.applicable_categories.length > 0) {
          // Discount on specific categories
          const eligibleTotal = cartItems
            .filter(item => {
              const product = item.product_id;
              // Find product category
              return promo.applicable_categories?.includes(item.category_id);
            })
            .reduce((sum, item) => sum + item.total, 0);
          discount = (eligibleTotal * promo.value) / 100;
        } else {
          // Discount on entire cart
          discount = (cartTotal * promo.value) / 100;
        }
        break;

      case 'fixed':
        discount = promo.value;
        break;

      case 'buy_x_get_y':
        // Simple buy X get Y logic (needs more sophisticated implementation)
        // For now, just apply percentage discount if conditions are met
        discount = (cartTotal * promo.value) / 100;
        break;
    }

    if (discount > bestDiscount) {
      bestDiscount = discount;
      appliedPromo = promo;
    }
  }

  return { discount: bestDiscount, appliedPromo };
};
