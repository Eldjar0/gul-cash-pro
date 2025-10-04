import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GiftCard {
  id: string;
  card_number: string;
  card_type: 'gift_card' | 'restaurant_voucher';
  initial_balance: number;
  current_balance: number;
  issued_date: string;
  expiry_date: string | null;
  customer_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GiftCardTransaction {
  id: string;
  gift_card_id: string;
  sale_id: string | null;
  transaction_type: 'load' | 'use' | 'refund';
  amount: number;
  balance_after: number;
  created_at: string;
}

export const useGiftCard = (cardNumber?: string) => {
  return useQuery({
    queryKey: ['gift-card', cardNumber],
    queryFn: async () => {
      if (!cardNumber) throw new Error('Card number required');

      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('card_number', cardNumber)
        .single();

      if (error) throw error;
      return data as GiftCard;
    },
    enabled: !!cardNumber,
  });
};

export const useGiftCardTransactions = (cardId?: string) => {
  return useQuery({
    queryKey: ['gift-card-transactions', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('Card ID required');

      const { data, error } = await supabase
        .from('gift_card_transactions')
        .select('*')
        .eq('gift_card_id', cardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GiftCardTransaction[];
    },
    enabled: !!cardId,
  });
};

export const useCreateGiftCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: Partial<GiftCard>) => {
      // Générer numéro unique
      const cardNumber = `GC-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const { data, error } = await supabase
        .from('gift_cards')
        .insert({ ...card, card_number: cardNumber })
        .select()
        .single();

      if (error) throw error;

      // Enregistrer transaction initiale
      const { error: txError } = await supabase
        .from('gift_card_transactions')
        .insert({
          gift_card_id: data.id,
          transaction_type: 'load',
          amount: data.initial_balance,
          balance_after: data.initial_balance,
        });

      if (txError) throw txError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
      toast.success('Carte cadeau créée');
    },
    onError: (error: Error) => {
      console.error('Error creating gift card:', error);
      toast.error('Erreur lors de la création');
    },
  });
};

export const useUseGiftCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, amount, saleId }: { cardId: string; amount: number; saleId?: string }) => {
      // Récupérer la carte
      const { data: card, error: fetchError } = await supabase
        .from('gift_cards')
        .select('current_balance')
        .eq('id', cardId)
        .single();

      if (fetchError) throw fetchError;

      if (card.current_balance < amount) {
        throw new Error('Solde insuffisant');
      }

      const newBalance = card.current_balance - amount;

      // Mettre à jour le solde
      const { error: updateError } = await supabase
        .from('gift_cards')
        .update({ current_balance: newBalance })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Enregistrer transaction
      const { error: txError } = await supabase
        .from('gift_card_transactions')
        .insert({
          gift_card_id: cardId,
          sale_id: saleId,
          transaction_type: 'use',
          amount: -amount,
          balance_after: newBalance,
        });

      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-card'] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-transactions'] });
      toast.success('Carte cadeau utilisée');
    },
    onError: (error: Error) => {
      console.error('Error using gift card:', error);
      toast.error(error.message || 'Erreur lors de l\'utilisation');
    },
  });
};
