import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Quote {
  id: string;
  quote_number: string;
  customer_id: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  quote_date: string;
  valid_until: string | null;
  subtotal: number;
  total_vat: number;
  total: number;
  notes: string | null;
  converted_to_sale_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  product_name: string;
  product_barcode: string | null;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  created_at: string;
}

export const useQuotes = (status?: Quote['status']) => {
  return useQuery({
    queryKey: ['quotes', status],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Quote[];
    },
  });
};

export const useQuoteDetails = (id?: string) => {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      if (!id) throw new Error('ID required');

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quote: Partial<Quote> & { items: Partial<QuoteItem>[] }) => {
      const { data: quoteNumber, error: fnError } = await supabase.rpc('generate_quote_number');
      if (fnError) throw fnError;

      const { items, ...quoteData } = quote;

      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({ ...quoteData, quote_number: quoteNumber })
        .select()
        .single();

      if (quoteError) throw quoteError;

      const itemsWithQuoteId = items.map(item => ({
        ...item,
        quote_id: newQuote.id,
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsWithQuoteId);

      if (itemsError) throw itemsError;

      return newQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Devis créé');
    },
    onError: (error: Error) => {
      console.error('Error creating quote:', error);
      toast.error('Erreur lors de la création');
    },
  });
};

export const useUpdateQuoteStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Quote['status'] }) => {
      const { error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote'] });
      toast.success('Statut mis à jour');
    },
    onError: (error: Error) => {
      console.error('Error updating quote status:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
};
