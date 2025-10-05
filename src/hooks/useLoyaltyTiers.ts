import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type LoyaltyTierType = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyTier {
  id: string;
  tier: LoyaltyTierType;
  name: string;
  min_spent: number;
  discount_percentage: number;
  points_multiplier: number;
  color: string;
  benefits: string | null;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  sale_id: string | null;
  transaction_type: 'earn' | 'redeem' | 'expire' | 'adjustment';
  points: number;
  balance_after: number;
  description: string | null;
  expires_at: string | null;
  created_at: string;
}

export const useLoyaltyTiers = () => {
  return useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('min_spent', { ascending: true });

      if (error) throw error;
      return data as LoyaltyTier[];
    },
  });
};

export const useCustomerTier = (customerId?: string) => {
  const { data: tiers } = useLoyaltyTiers();

  return useQuery({
    queryKey: ['customer-tier', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID required');

      // Calculer le total dépensé
      const { data: sales, error } = await supabase
        .from('sales')
        .select('total')
        .eq('customer_id', customerId)
        .eq('is_cancelled', false);

      if (error) throw error;

      const totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0);

      // Trouver le tier approprié
      const tier = [...(tiers || [])]
        .reverse()
        .find(t => totalSpent >= t.min_spent);

      return { tier, totalSpent };
    },
    enabled: !!customerId && !!tiers,
  });
};

export const useLoyaltyTransactions = (customerId?: string) => {
  return useQuery({
    queryKey: ['loyalty-transactions', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID required');

      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!customerId,
  });
};

export const useAddLoyaltyPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, points, saleId, description }: { customerId: string; points: number; saleId?: string; description?: string }) => {
      // Récupérer le solde actuel
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = (customer.loyalty_points || 0) + points;

      // Mettre à jour le solde
      const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: newBalance })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Enregistrer la transaction
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: customerId,
          sale_id: saleId,
          transaction_type: 'earn',
          points,
          balance_after: newBalance,
          description,
        });

      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      toast.success('Points ajoutés');
    },
    onError: (error: Error) => {
      console.error('Error adding loyalty points:', error);
      toast.error('Erreur lors de l\'ajout');
    },
  });
};

export const useRedeemLoyaltyPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, points, description }: { customerId: string; points: number; description?: string }) => {
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();

      if (fetchError) throw fetchError;

      if ((customer.loyalty_points || 0) < points) {
        throw new Error('Points insuffisants');
      }

      const newBalance = (customer.loyalty_points || 0) - points;

      const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: newBalance })
        .eq('id', customerId);

      if (updateError) throw updateError;

      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: customerId,
          transaction_type: 'redeem',
          points: -points,
          balance_after: newBalance,
          description,
        });

      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      toast.success('Points utilisés');
    },
    onError: (error: Error) => {
      console.error('Error redeeming loyalty points:', error);
      toast.error(error.message || 'Erreur');
    },
  });
};
