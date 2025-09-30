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
      // Get sale number
      const { data: saleNumber, error: numberError } = await supabase
        .rpc('generate_sale_number');

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

      // Update stock for products
      for (const item of items) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product && product.stock !== null) {
            await supabase
              .from('products')
              .update({ stock: product.stock - item.quantity })
              .eq('id', item.product_id);
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
    onError: (error) => {
      console.error('Error creating sale:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la vente.',
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
        .select('*, sale_items(*)')
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
