import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SaleItem {
  product_id?: string;
  product_name: string;
  product_barcode?: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount_type?: string;
  discount_value?: number;
  subtotal: number;
  vat_amount: number;
  total: number;
}

export interface Sale {
  id?: string;
  sale_number?: string;
  date?: Date;
  customer_id?: string;
  cashier_id?: string;
  subtotal: number;
  total_vat: number;
  total_discount: number;
  total: number;
  payment_method: 'cash' | 'card' | 'mobile' | 'check' | 'voucher';
  amount_paid?: number;
  change_amount?: number;
  is_invoice: boolean;
  is_cancelled: boolean;
  notes?: string;
  items: SaleItem[];
}

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sale: Sale) => {
      // Verify stock availability BEFORE creating the sale
      for (const item of sale.items) {
        if (item.product_id) {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock, name')
            .eq('id', item.product_id)
            .single();

          if (productError) {
            throw new Error(`Erreur lors de la vérification du produit ${item.product_name}`);
          }

          if (product && product.stock !== null) {
            const newStock = product.stock - item.quantity;
            
            // Check if stock would become negative
            if (newStock < 0) {
              throw new Error(`Stock insuffisant pour "${product.name}". Disponible: ${product.stock}, demandé: ${item.quantity}`);
            }
          }
        }
      }

      // Get sale number with correct format (ticket or invoice)
      const { data: saleNumber, error: numberError } = await supabase
        .rpc('generate_sale_number', { is_invoice_param: sale.is_invoice || false });

      if (numberError) throw numberError;

      const { items, id, sale_number, date, ...saleData } = sale;

      // Create sale
      const { data: createdSale, error: saleError } = await supabase
        .from('sales')
        .insert({
          subtotal: saleData.subtotal,
          total_vat: saleData.total_vat,
          total_discount: saleData.total_discount,
          total: saleData.total,
          payment_method: saleData.payment_method,
          amount_paid: saleData.amount_paid,
          change_amount: saleData.change_amount,
          is_invoice: saleData.is_invoice,
          is_cancelled: saleData.is_cancelled,
          notes: saleData.notes,
          customer_id: saleData.customer_id,
          cashier_id: saleData.cashier_id,
          sale_number: saleNumber as string,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = items.map(item => ({
        ...item,
        sale_id: createdSale.id,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update stock for products (stock was already verified above)
      for (const item of items) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product && product.stock !== null) {
            const newStock = product.stock - item.quantity;

            const { error: updateError } = await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);

            if (updateError) {
              console.error('Error updating stock:', updateError);
              throw updateError;
            }
          }
        }
      }

      // Create cash movement
      if (sale.payment_method === 'cash') {
        await supabase
          .from('cash_movements')
          .insert({
            type: 'sale',
            amount: sale.total,
            sale_id: createdSale.id,
            cashier_id: sale.cashier_id,
          });
      }

      return createdSale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Vente enregistrée',
        description: 'La vente a été enregistrée avec succès.',
      });
    },
    onError: (error: Error) => {
      console.error('Error creating sale:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'enregistrer la vente.',
        variant: 'destructive',
      });
    },
  });
};

export const useSales = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['sales', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items(*),
          customers(
            id,
            name,
            email,
            phone,
            vat_number
          )
        `)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useSale = (id: string) => {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCancelSale = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ saleId, reason }: { saleId: string; reason: string }) => {
      // Marquer la vente comme annulée au lieu de la supprimer (conformité légale belge)
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          is_cancelled: true,
          notes: reason ? `ANNULÉE: ${reason}` : 'ANNULÉE',
        })
        .eq('id', saleId);

      if (saleError) throw saleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: 'Vente annulée',
        description: 'La vente a été marquée comme annulée (conservation légale).',
      });
    },
    onError: (error: Error) => {
      console.error('Error cancelling sale:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler la vente.',
        variant: 'destructive',
      });
    },
  });
};

// Keep for backwards compatibility but deprecated
export const useDeleteSale = useCancelSale;

export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ saleId, updates }: { saleId: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', saleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: 'Vente modifiée',
        description: 'La vente a été modifiée avec succès.',
      });
    },
    onError: (error: Error) => {
      console.error('Error updating sale:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la vente.',
        variant: 'destructive',
      });
    },
  });
};
