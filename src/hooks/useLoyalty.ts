import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LoyaltyConfig {
  enabled: boolean;
  pointsPerEuro: number;
  euroPerPoint: number;
  minPointsToRedeem: number;
  maxRedemptionPercent: number;
}

// Hook pour obtenir la configuration de fidélité
export const useLoyaltyConfig = () => {
  return useQuery({
    queryKey: ['loyalty-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'loyalty_config')
        .maybeSingle();

      if (data?.value) {
        return data.value as unknown as LoyaltyConfig;
      }

      return {
        enabled: true,
        pointsPerEuro: 10,
        euroPerPoint: 0.01,
        minPointsToRedeem: 100,
        maxRedemptionPercent: 50,
      };
    },
  });
};

// Hook pour sauvegarder la configuration
export const useSaveLoyaltyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: LoyaltyConfig) => {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'loyalty_config',
          value: config as any,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-config'] });
      toast.success('Configuration de fidélité enregistrée');
    },
    onError: (error: Error) => {
      console.error('Error saving loyalty config:', error);
      toast.error('Erreur lors de l\'enregistrement');
    },
  });
};

// Hook pour ajouter des points de fidélité
export const useAddLoyaltyPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, points }: { customerId: string; points: number }) => {
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();

      if (fetchError) throw fetchError;

      const newPoints = (customer.loyalty_points || 0) + points;

      const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: newPoints })
        .eq('id', customerId);

      if (updateError) throw updateError;

      return newPoints;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: Error) => {
      console.error('Error adding loyalty points:', error);
      toast.error('Erreur lors de l\'ajout des points');
    },
  });
};

// Hook pour utiliser des points de fidélité
export const useRedeemLoyaltyPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, points }: { customerId: string; points: number }) => {
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();

      if (fetchError) throw fetchError;

      const currentPoints = customer.loyalty_points || 0;
      if (currentPoints < points) {
        throw new Error('Points insuffisants');
      }

      const newPoints = currentPoints - points;

      const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: newPoints })
        .eq('id', customerId);

      if (updateError) throw updateError;

      return newPoints;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: Error) => {
      console.error('Error redeeming points:', error);
      toast.error(error.message === 'Points insuffisants' ? 'Points insuffisants' : 'Erreur lors de l\'utilisation des points');
    },
  });
};
