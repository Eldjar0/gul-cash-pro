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
}

// Hook pour obtenir les paniers sauvegardés de l'utilisateur
export const useSavedCarts = () => {
  return useQuery({
    queryKey: ['saved-carts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_carts')
        .select('*')
        .eq('cashier_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as SavedCart[];
    },
  });
};

// Hook pour sauvegarder un panier
export const useSaveCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartName, cartData }: { cartName: string; cartData: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_carts')
        .insert({
          cashier_id: user.id,
          cart_name: cartName,
          cart_data: cartData,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-carts'] });
      toast.success('Panier sauvegardé avec succès');
    },
    onError: (error: Error) => {
      console.error('Error saving cart:', error);
      toast.error('Erreur lors de la sauvegarde du panier');
    },
  });
};

// Hook pour charger un panier sauvegardé
export const useLoadCart = () => {
  return useMutation({
    mutationFn: async (cartId: string) => {
      const { data, error } = await supabase
        .from('saved_carts')
        .select('*')
        .eq('id', cartId)
        .single();

      if (error) throw error;
      return data as SavedCart;
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

// Hook pour supprimer un panier sauvegardé
export const useDeleteSavedCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await supabase
        .from('saved_carts')
        .delete()
        .eq('id', cartId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-carts'] });
      toast.success('Panier supprimé avec succès');
    },
    onError: (error: Error) => {
      console.error('Error deleting cart:', error);
      toast.error('Erreur lors de la suppression du panier');
    },
  });
};