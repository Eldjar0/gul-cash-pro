import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string | null;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery_date: string | null;
  received_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  product_name: string;
  product_barcode: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  tax_rate: number;
  subtotal: number;
  created_at: string;
}

export const usePurchaseOrders = () => {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
};

export const usePurchaseOrderDetails = (id?: string) => {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      if (!id) throw new Error('ID required');

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (po: Partial<PurchaseOrder> & { items: Partial<PurchaseOrderItem>[] }) => {
      // Générer le numéro PO
      const { data: poNumber, error: fnError } = await supabase.rpc('generate_po_number');
      if (fnError) throw fnError;

      const { items, ...poData } = po;

      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({ ...poData, po_number: poNumber })
        .select()
        .single();

      if (poError) throw poError;

      // Insérer les items
      const itemsWithPOId = items.map(item => ({
        purchase_order_id: newPO.id,
        product_id: item.product_id,
        product_name: item.product_name!,
        product_barcode: item.product_barcode,
        quantity_ordered: item.quantity_ordered!,
        quantity_received: item.quantity_received || 0,
        unit_cost: item.unit_cost!,
        tax_rate: item.tax_rate || 0,
        subtotal: item.subtotal!,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsWithPOId);

      if (itemsError) throw itemsError;

      return newPO;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Commande créée');
    },
    onError: (error: Error) => {
      console.error('Error creating PO:', error);
      toast.error('Erreur lors de la création');
    },
  });
};

export const useUpdatePurchaseOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PurchaseOrder['status'] }) => {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
      toast.success('Statut mis à jour');
    },
    onError: (error: Error) => {
      console.error('Error updating PO status:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
};
