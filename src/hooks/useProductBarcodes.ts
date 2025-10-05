import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductBarcode {
  id: string;
  product_id: string;
  barcode: string;
  is_primary: boolean;
  created_at?: string;
}

export const useProductBarcodes = (productId?: string) => {
  return useQuery({
    queryKey: ['product-barcodes', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_barcodes')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data as ProductBarcode[];
    },
    enabled: !!productId,
  });
};

export const useAddProductBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, barcode, isPrimary = false }: { productId: string; barcode: string; isPrimary?: boolean }) => {
      const { data, error } = await supabase
        .from('product_barcodes')
        .insert({
          product_id: productId,
          barcode,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-barcodes', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Code-barres ajouté');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Ce code-barres existe déjà pour ce produit');
      } else {
        toast.error('Erreur lors de l\'ajout du code-barres');
      }
    },
  });
};

export const useDeleteProductBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('product_barcodes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, productId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-barcodes', data.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Code-barres supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du code-barres');
    },
  });
};

export const useSetPrimaryBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('product_barcodes')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;
      return { id, productId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-barcodes', data.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Code-barres principal défini');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
};