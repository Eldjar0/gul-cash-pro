import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RefundItem {
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

export interface Refund {
  id?: string;
  refund_number?: string;
  original_sale_id?: string;
  cashier_id?: string;
  customer_id?: string;
  reason: string;
  refund_type: 'full' | 'partial';
  subtotal: number;
  total_vat: number;
  total: number;
  payment_method: 'cash' | 'card' | 'mobile' | 'check' | 'voucher';
  notes?: string;
  items: RefundItem[];
  created_at?: string;
}

// Hook pour créer un remboursement
export const useCreateRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refund: Refund) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Générer le numéro de remboursement
      const { data: refundNumber, error: numberError } = await supabase
        .rpc('generate_refund_number');

      if (numberError) throw numberError;

      const { items, ...refundData } = refund;

      // Créer le remboursement
      const { data: createdRefund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          ...refundData,
          refund_number: refundNumber as string,
          cashier_id: user.id,
        })
        .select()
        .single();

      if (refundError) throw refundError;

      // Créer les items du remboursement
      const refundItems = items.map(item => ({
        ...item,
        refund_id: createdRefund.id,
      }));

      const { error: itemsError } = await supabase
        .from('refund_items')
        .insert(refundItems);

      if (itemsError) throw itemsError;

      // Remettre le stock pour les produits
      for (const item of items) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product && product.stock !== null) {
            const newStock = product.stock + item.quantity;

            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);
          }
        }
      }

      // Créer un mouvement de caisse négatif
      if (refund.payment_method === 'cash') {
        await supabase
          .from('cash_movements')
          .insert({
            type: 'refund',
            amount: -refund.total,
            cashier_id: user.id,
            notes: `Remboursement ${refundNumber}`,
          });
      }

      return createdRefund;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cash_movements'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['sales'], refetchType: 'active' });
      toast.success('Remboursement créé avec succès');
    },
    onError: (error: Error) => {
      console.error('Error creating refund:', error);
      toast.error('Erreur lors de la création du remboursement');
    },
  });
};

// Hook pour obtenir tous les remboursements
export const useRefunds = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['refunds', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('refunds')
        .select(`
          *,
          refund_items(*),
          customers(
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Hook pour obtenir un remboursement par ID
export const useRefund = (id: string) => {
  return useQuery({
    queryKey: ['refunds', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds')
        .select('*, refund_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

// Hook pour supprimer un remboursement
export const useDeleteRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refundId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Récupérer les détails du remboursement
      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .select('*, refund_items(*)')
        .eq('id', refundId)
        .single();

      if (refundError) throw refundError;
      if (!refund) throw new Error('Remboursement introuvable');

      // Retirer le stock qui avait été rajouté lors du remboursement
      for (const item of refund.refund_items) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product && product.stock !== null) {
            const newStock = product.stock - item.quantity;

            await supabase
              .from('products')
              .update({ stock: Math.max(0, newStock) })
              .eq('id', item.product_id);
          }
        }
      }

      // Supprimer les items du remboursement
      const { error: itemsError } = await supabase
        .from('refund_items')
        .delete()
        .eq('refund_id', refundId);

      if (itemsError) throw itemsError;

      // Supprimer le remboursement
      const { error: deleteError } = await supabase
        .from('refunds')
        .delete()
        .eq('id', refundId);

      if (deleteError) throw deleteError;

      // Créer un mouvement de caisse positif pour annuler le remboursement
      if (refund.payment_method === 'cash') {
        await supabase
          .from('cash_movements')
          .insert({
            type: 'deposit',
            amount: refund.total,
            cashier_id: user.id,
            notes: `Annulation remboursement ${refund.refund_number}`,
          });
      }

      return refund;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cash_movements'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['sales'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['daily_reports'], refetchType: 'active' });
      toast.success('Remboursement supprimé avec succès');
    },
    onError: (error: Error) => {
      console.error('Error deleting refund:', error);
      toast.error('Erreur lors de la suppression du remboursement');
    },
  });
};