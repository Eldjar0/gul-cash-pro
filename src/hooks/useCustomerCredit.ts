import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerCreditAccount {
  id: string;
  customer_id: string;
  credit_limit: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreditTransaction {
  id: string;
  customer_id: string;
  sale_id: string | null;
  transaction_type: 'charge' | 'payment' | 'adjustment';
  amount: number;
  balance_after: number;
  notes: string | null;
  created_at: string;
}

export const useCustomerCredit = () => {
  return useQuery({
    queryKey: ['customer-credit-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_credit_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerCreditAccount[];
    },
  });
};

export const useCustomerCreditAccount = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-credit-account', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID required');

      const { data, error } = await supabase
        .from('customer_credit_accounts')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (error) throw error;
      return data as CustomerCreditAccount | null;
    },
    enabled: !!customerId,
  });
};

export const useCustomerCreditTransactions = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-credit-transactions', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID required');

      const { data, error } = await supabase
        .from('customer_credit_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerCreditTransaction[];
    },
    enabled: !!customerId,
  });
};

export const useCreateCreditAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, creditLimit }: { customerId: string; creditLimit: number }) => {
      const { error } = await supabase
        .from('customer_credit_accounts')
        .insert({
          customer_id: customerId,
          credit_limit: creditLimit,
          current_balance: 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-credit-account'] });
      toast.success('Compte crédit créé');
    },
    onError: (error: Error) => {
      console.error('Error creating credit account:', error);
      toast.error('Erreur lors de la création');
    },
  });
};

export const useChargeCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, amount, saleId, notes }: { customerId: string; amount: number; saleId?: string; notes?: string }) => {
      // Récupérer le compte
      const { data: account, error: fetchError } = await supabase
        .from('customer_credit_accounts')
        .select('current_balance, credit_limit')
        .eq('customer_id', customerId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = account.current_balance + amount;

      if (newBalance > account.credit_limit) {
        throw new Error('Limite de crédit dépassée');
      }

      // Mettre à jour le solde
      const { error: updateError } = await supabase
        .from('customer_credit_accounts')
        .update({ current_balance: newBalance })
        .eq('customer_id', customerId);

      if (updateError) throw updateError;

      // Enregistrer transaction
      const { error: txError } = await supabase
        .from('customer_credit_transactions')
        .insert({
          customer_id: customerId,
          sale_id: saleId,
          transaction_type: 'charge',
          amount,
          balance_after: newBalance,
          notes,
        });

      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-credit-account'] });
      queryClient.invalidateQueries({ queryKey: ['customer-credit-transactions'] });
      toast.success('Crédit utilisé');
    },
    onError: (error: Error) => {
      console.error('Error charging credit:', error);
      toast.error(error.message || 'Erreur');
    },
  });
};

export const usePayCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, amount, notes }: { customerId: string; amount: number; notes?: string }) => {
      const { data: account, error: fetchError } = await supabase
        .from('customer_credit_accounts')
        .select('current_balance')
        .eq('customer_id', customerId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = Math.max(0, account.current_balance - amount);

      const { error: updateError } = await supabase
        .from('customer_credit_accounts')
        .update({ current_balance: newBalance })
        .eq('customer_id', customerId);

      if (updateError) throw updateError;

      const { error: txError } = await supabase
        .from('customer_credit_transactions')
        .insert({
          customer_id: customerId,
          transaction_type: 'payment',
          amount: -amount,
          balance_after: newBalance,
          notes,
        });

      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-credit-account'] });
      queryClient.invalidateQueries({ queryKey: ['customer-credit-transactions'] });
      toast.success('Paiement enregistré');
    },
    onError: (error: Error) => {
      console.error('Error paying credit:', error);
      toast.error('Erreur lors du paiement');
    },
  });
};
