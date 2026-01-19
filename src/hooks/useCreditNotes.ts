import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreditNoteItem {
  id?: string;
  credit_note_id?: string;
  product_id?: string;
  product_name: string;
  product_barcode?: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
}

export interface CreditNote {
  id: string;
  credit_note_number: string;
  created_at: string;
  customer_id?: string;
  original_invoice_id?: string;
  reason: string;
  notes?: string;
  subtotal: number;
  total_vat: number;
  total: number;
  status: 'draft' | 'validated' | 'cancelled';
  validated_at?: string;
  cashier_id?: string;
  customers?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    vat_number?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  original_invoice?: {
    id: string;
    sale_number: string;
    date: string;
    total: number;
  };
  credit_note_items?: CreditNoteItem[];
}

export function useCreditNotes() {
  return useQuery({
    queryKey: ['credit-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_notes')
        .select(`
          *,
          customers (id, name, email, phone, vat_number, address, city, postal_code),
          credit_note_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CreditNote[];
    },
  });
}

export function useCreditNote(id: string | undefined) {
  return useQuery({
    queryKey: ['credit-note', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('credit_notes')
        .select(`
          *,
          customers (id, name, email, phone, vat_number, address, city, postal_code),
          credit_note_items (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as CreditNote | null;
    },
    enabled: !!id,
  });
}

export function useCreateCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customer_id?: string;
      original_invoice_id?: string;
      reason: string;
      notes?: string;
      items: CreditNoteItem[];
    }) => {
      // Generate credit note number
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_credit_note_number');
      
      if (numberError) throw numberError;

      const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
      const total_vat = data.items.reduce((sum, item) => sum + item.vat_amount, 0);
      const total = data.items.reduce((sum, item) => sum + item.total, 0);

      // Create credit note
      const { data: creditNote, error: creditNoteError } = await supabase
        .from('credit_notes')
        .insert({
          credit_note_number: numberData,
          customer_id: data.customer_id,
          original_invoice_id: data.original_invoice_id,
          reason: data.reason,
          notes: data.notes,
          subtotal,
          total_vat,
          total,
          status: 'draft',
        })
        .select()
        .single();

      if (creditNoteError) throw creditNoteError;

      // Insert items
      if (data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
          credit_note_id: creditNote.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_barcode: item.product_barcode,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          subtotal: item.subtotal,
          vat_amount: item.vat_amount,
          total: item.total,
        }));

        const { error: itemsError } = await supabase
          .from('credit_note_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return creditNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      toast.success('Note de crédit créée');
    },
    onError: (error) => {
      console.error('Error creating credit note:', error);
      toast.error('Erreur lors de la création de la note de crédit');
    },
  });
}

export function useUpdateCreditNoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'validated' | 'cancelled' }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'validated') {
        updateData.validated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('credit_notes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      toast.success('Statut mis à jour');
    },
    onError: (error) => {
      console.error('Error updating credit note status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });
}

export function useDeleteCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('credit_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      toast.success('Note de crédit supprimée');
    },
    onError: (error) => {
      console.error('Error deleting credit note:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
}
