import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupplierReceipt {
  id: string;
  receipt_number: string;
  supplier_id: string | null;
  supplier_name: string;
  supplier_invoice_number: string | null;
  supplier_invoice_total: number | null;
  calculated_total: number;
  status: 'draft' | 'validated' | 'cancelled';
  has_discrepancy: boolean;
  notes: string | null;
  received_by: string | null;
  received_date: string;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierReceiptItem {
  id: string;
  receipt_id: string;
  product_id: string | null;
  product_name: string;
  product_barcode: string | null;
  quantity: number;
  expected_unit_cost: number | null;
  actual_unit_cost: number;
  has_price_change: boolean;
  notes: string | null;
  created_at: string;
}

export interface SupplierReceiptWithItems extends SupplierReceipt {
  items: SupplierReceiptItem[];
}

// Fetch all supplier receipts
export const useSupplierReceipts = () => {
  return useQuery({
    queryKey: ['supplier-receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupplierReceipt[];
    },
  });
};

// Fetch a single receipt with its items
export const useSupplierReceiptDetails = (id?: string) => {
  return useQuery({
    queryKey: ['supplier-receipt', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: receipt, error: receiptError } = await supabase
        .from('supplier_receipts')
        .select('*')
        .eq('id', id)
        .single();

      if (receiptError) throw receiptError;

      const { data: items, error: itemsError } = await supabase
        .from('supplier_receipt_items')
        .select('*')
        .eq('receipt_id', id)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...receipt,
        items: items || [],
      } as SupplierReceiptWithItems;
    },
    enabled: !!id,
  });
};

// Create a new supplier receipt
export const useCreateSupplierReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      supplier_id?: string;
      supplier_name: string;
      supplier_invoice_number?: string;
      supplier_invoice_total?: number;
      notes?: string;
    }) => {
      // Generate receipt number
      const { data: receiptNumber, error: numError } = await supabase
        .rpc('generate_supplier_receipt_number');

      if (numError) throw numError;

      const { data: user } = await supabase.auth.getUser();

      const { data: receipt, error } = await supabase
        .from('supplier_receipts')
        .insert({
          receipt_number: receiptNumber,
          supplier_id: data.supplier_id || null,
          supplier_name: data.supplier_name,
          supplier_invoice_number: data.supplier_invoice_number || null,
          supplier_invoice_total: data.supplier_invoice_total || null,
          notes: data.notes || null,
          received_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return receipt as SupplierReceipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-receipts'] });
      toast.success('Réception créée');
    },
    onError: (error: Error) => {
      console.error('Error creating receipt:', error);
      toast.error('Erreur lors de la création');
    },
  });
};

// Add an item to a receipt
export const useAddReceiptItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      receipt_id: string;
      product_id?: string;
      product_name: string;
      product_barcode?: string;
      quantity: number;
      expected_unit_cost?: number;
      actual_unit_cost: number;
      notes?: string;
    }) => {
      const has_price_change = data.expected_unit_cost !== undefined && 
        data.expected_unit_cost !== data.actual_unit_cost;

      const { data: item, error } = await supabase
        .from('supplier_receipt_items')
        .insert({
          receipt_id: data.receipt_id,
          product_id: data.product_id || null,
          product_name: data.product_name,
          product_barcode: data.product_barcode || null,
          quantity: data.quantity,
          expected_unit_cost: data.expected_unit_cost || null,
          actual_unit_cost: data.actual_unit_cost,
          has_price_change,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update calculated_total
      await updateReceiptTotal(data.receipt_id);

      return item as SupplierReceiptItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-receipt', variables.receipt_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-receipts'] });
    },
    onError: (error: Error) => {
      console.error('Error adding item:', error);
      toast.error('Erreur lors de l\'ajout de l\'article');
    },
  });
};

// Update an item
export const useUpdateReceiptItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      receipt_id: string;
      quantity?: number;
      actual_unit_cost?: number;
      notes?: string;
    }) => {
      const updateData: any = {};
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.actual_unit_cost !== undefined) updateData.actual_unit_cost = data.actual_unit_cost;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const { error } = await supabase
        .from('supplier_receipt_items')
        .update(updateData)
        .eq('id', data.id);

      if (error) throw error;

      // Update calculated_total
      await updateReceiptTotal(data.receipt_id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-receipt', variables.receipt_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-receipts'] });
    },
  });
};

// Delete an item
export const useDeleteReceiptItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; receipt_id: string }) => {
      const { error } = await supabase
        .from('supplier_receipt_items')
        .delete()
        .eq('id', data.id);

      if (error) throw error;

      await updateReceiptTotal(data.receipt_id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-receipt', variables.receipt_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-receipts'] });
    },
  });
};

// Validate a receipt (update stock, cost prices)
export const useValidateReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiptId: string) => {
      // Get receipt with items
      const { data: receipt, error: receiptError } = await supabase
        .from('supplier_receipts')
        .select('*')
        .eq('id', receiptId)
        .single();

      if (receiptError) throw receiptError;

      const { data: items, error: itemsError } = await supabase
        .from('supplier_receipt_items')
        .select('*')
        .eq('receipt_id', receiptId);

      if (itemsError) throw itemsError;

      // Update stock for each item with a product_id
      for (const item of items || []) {
        if (item.product_id) {
          // Get current product
          const { data: product } = await supabase
            .from('products')
            .select('stock, cost_price, name, barcode')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newStock = (product.stock || 0) + item.quantity;
            
            // Update product stock and cost_price
            await supabase
              .from('products')
              .update({
                stock: newStock,
                cost_price: item.actual_unit_cost,
              })
              .eq('id', item.product_id);

            // Create stock movement
            await supabase
              .from('stock_movements')
              .insert({
                product_id: item.product_id,
                product_name: product.name,
                product_barcode: product.barcode,
                movement_type: 'in',
                quantity: item.quantity,
                previous_stock: product.stock || 0,
                new_stock: newStock,
                reason: `Réception fournisseur ${receipt.receipt_number}`,
                reference_id: receiptId,
                reference_type: 'supplier_receipt',
              });
          }
        }
      }

      // Mark receipt as validated
      const { error: updateError } = await supabase
        .from('supplier_receipts')
        .update({
          status: 'validated',
          validated_at: new Date().toISOString(),
        })
        .eq('id', receiptId);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('Réception validée - Stock mis à jour');
    },
    onError: (error: Error) => {
      console.error('Error validating receipt:', error);
      toast.error('Erreur lors de la validation');
    },
  });
};

// Helper function to update receipt total
async function updateReceiptTotal(receiptId: string) {
  const { data: items } = await supabase
    .from('supplier_receipt_items')
    .select('quantity, actual_unit_cost')
    .eq('receipt_id', receiptId);

  const calculatedTotal = (items || []).reduce(
    (sum, item) => sum + item.quantity * item.actual_unit_cost,
    0
  );

  // Check for discrepancy
  const { data: receipt } = await supabase
    .from('supplier_receipts')
    .select('supplier_invoice_total')
    .eq('id', receiptId)
    .single();

  const hasDiscrepancy = receipt?.supplier_invoice_total !== null && 
    Math.abs(calculatedTotal - (receipt?.supplier_invoice_total || 0)) > 0.01;

  await supabase
    .from('supplier_receipts')
    .update({
      calculated_total: calculatedTotal,
      has_discrepancy: hasDiscrepancy,
    })
    .eq('id', receiptId);
}

// Update receipt header info
export const useUpdateSupplierReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      supplier_invoice_number?: string;
      supplier_invoice_total?: number;
      notes?: string;
    }) => {
      const updateData: any = {};
      if (data.supplier_invoice_number !== undefined) 
        updateData.supplier_invoice_number = data.supplier_invoice_number;
      if (data.supplier_invoice_total !== undefined) 
        updateData.supplier_invoice_total = data.supplier_invoice_total;
      if (data.notes !== undefined) 
        updateData.notes = data.notes;

      const { error } = await supabase
        .from('supplier_receipts')
        .update(updateData)
        .eq('id', data.id);

      if (error) throw error;

      // Recalculate discrepancy
      await updateReceiptTotal(data.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-receipt', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-receipts'] });
    },
  });
};
