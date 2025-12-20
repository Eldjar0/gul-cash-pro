import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PromotionConditions {
  buy_product_id?: string;
  buy_quantity?: number;
  get_product_id?: string;
  get_quantity?: number;
  min_amount?: number;
  discount_value?: number;
  discount_type?: 'percentage' | 'fixed';
  // Bundle/Lot pricing
  bundle_quantity?: number;
  bundle_price?: number;
  unit_price?: number;
}

export interface PromotionSchedule {
  dates?: string[];
  days?: number[];
  time_start?: string;
  time_end?: string;
  date_start?: string;
  date_end?: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'buy_x_get_y' | 'spend_amount_get_discount' | 'cart_percentage' | 'cart_fixed' | 'product_discount' | 'bundle_price';
  conditions: PromotionConditions;
  is_active: boolean;
  show_on_display: boolean;
  customer_type: 'all' | 'professional' | 'individual';
  schedule_type: 'always' | 'specific_dates' | 'recurring_days' | 'date_range';
  schedule_config: PromotionSchedule;
  priority: number;
  created_at: string;
  updated_at: string;
}

export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Promotion[];
    },
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert({
          ...promotion,
          conditions: promotion.conditions as any,
          schedule_config: promotion.schedule_config as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast.success('Promotion créée avec succès');
    },
    onError: (error: Error) => {
      console.error('Error creating promotion:', error);
      toast.error('Erreur lors de la création');
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Promotion> & { id: string }) => {
      const { data, error } = await supabase
        .from('promotions')
        .update({
          ...updates,
          conditions: updates.conditions as any,
          schedule_config: updates.schedule_config as any,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast.success('Promotion mise à jour');
    },
    onError: (error: Error) => {
      console.error('Error updating promotion:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast.success('Promotion supprimée');
    },
    onError: (error: Error) => {
      console.error('Error deleting promotion:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
};

export const useActivePromotions = () => {
  return useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDate = now.toISOString().split('T')[0];

      return (data as Promotion[]).filter(promo => {
        const config = promo.schedule_config as PromotionSchedule;
        
        // Check schedule
        if (promo.schedule_type === 'specific_dates' && config.dates) {
          if (!config.dates.includes(currentDate)) return false;
        }

        if (promo.schedule_type === 'recurring_days' && config.days) {
          if (!config.days.includes(currentDay)) return false;
        }

        if (promo.schedule_type === 'date_range') {
          const start = config.date_start;
          const end = config.date_end;
          if (start && currentDate < start) return false;
          if (end && currentDate > end) return false;
        }

        // Check time
        if (config.time_start && currentTime < config.time_start) return false;
        if (config.time_end && currentTime > config.time_end) return false;

        return true;
      });
    },
    refetchInterval: 60000,
  });
};

export const calculateDiscount = (
  cartItems: any[],
  promotions: Promotion[],
  customerType: 'professional' | 'individual' | null
): { discount: number; appliedPromo: Promotion | null; freeItems: any[] } => {
  let bestDiscount = 0;
  let appliedPromo: Promotion | null = null;
  let freeItems: any[] = [];

  const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  for (const promo of promotions) {
    // Check customer type
    if (promo.customer_type === 'professional' && customerType !== 'professional') continue;
    if (promo.customer_type === 'individual' && customerType !== 'individual') continue;

    const conditions = promo.conditions as PromotionConditions;
    let discount = 0;

    switch (promo.type) {
      case 'buy_x_get_y':
        // Buy X get Y promotion
        if (conditions.buy_product_id && conditions.buy_quantity && conditions.get_product_id && conditions.get_quantity) {
          const buyItem = cartItems.find(item => item.product_id === conditions.buy_product_id);
          if (buyItem && buyItem.quantity >= conditions.buy_quantity) {
            // Add free item
            const freeProduct = cartItems.find(item => item.product_id === conditions.get_product_id);
            if (freeProduct) {
              const freeQty = Math.floor(buyItem.quantity / conditions.buy_quantity) * conditions.get_quantity;
              discount = freeProduct.unit_price * freeQty;
              freeItems = [{
                product_id: conditions.get_product_id,
                quantity: freeQty,
                unit_price: freeProduct.unit_price
              }];
            }
          }
        }
        break;

      case 'spend_amount_get_discount':
        // Spend X get discount
        if (conditions.min_amount && cartTotal >= conditions.min_amount && conditions.discount_value) {
          discount = conditions.discount_type === 'percentage' 
            ? (cartTotal * conditions.discount_value) / 100
            : conditions.discount_value;
        }
        break;

      case 'cart_percentage':
        // Percentage discount on entire cart
        if (conditions.discount_value) {
          if (conditions.min_amount && cartTotal < conditions.min_amount) continue;
          discount = (cartTotal * conditions.discount_value) / 100;
        }
        break;

      case 'cart_fixed':
        // Fixed amount discount on cart
        if (conditions.discount_value) {
          if (conditions.min_amount && cartTotal < conditions.min_amount) continue;
          discount = conditions.discount_value;
        }
        break;

      case 'product_discount':
        // Discount on specific product
        if (conditions.buy_product_id && conditions.discount_value) {
          const productItem = cartItems.find(item => item.product_id === conditions.buy_product_id);
          if (productItem) {
            discount = conditions.discount_type === 'percentage'
              ? (productItem.total * conditions.discount_value) / 100
              : conditions.discount_value * productItem.quantity;
          }
        }
        break;

      case 'bundle_price':
        // Bundle/Lot pricing - e.g., "2 for 2.50€"
        if (conditions.buy_product_id && conditions.bundle_quantity && conditions.bundle_price) {
          const productItem = cartItems.find(item => item.product_id === conditions.buy_product_id);
          if (productItem && productItem.quantity >= conditions.bundle_quantity) {
            // Calculate how many complete bundles
            const numBundles = Math.floor(productItem.quantity / conditions.bundle_quantity);
            const remainingQty = productItem.quantity % conditions.bundle_quantity;
            
            // Normal price for all items
            const normalTotal = productItem.unit_price * productItem.quantity;
            // Bundle price for complete bundles + normal price for remaining items
            const bundleTotal = (numBundles * conditions.bundle_price) + (remainingQty * productItem.unit_price);
            
            discount = normalTotal - bundleTotal;
          }
        }
        break;
    }

    if (discount > bestDiscount) {
      bestDiscount = discount;
      appliedPromo = promo;
    }
  }

  return { discount: bestDiscount, appliedPromo, freeItems };
};
