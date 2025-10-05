import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook pour les opérations en lot sur les produits
export const useBatchUpdateProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productIds, 
      updates 
    }: { 
      productIds: string[]; 
      updates: Record<string, any> 
    }) => {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .in('id', productIds);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${variables.productIds.length} produit(s) mis à jour`);
    },
    onError: (error: Error) => {
      console.error('Error batch updating products:', error);
      toast.error('Erreur lors de la mise à jour en lot');
    },
  });
};

// Hook pour activer/désactiver plusieurs produits
export const useBatchToggleProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productIds, 
      isActive 
    }: { 
      productIds: string[]; 
      isActive: boolean 
    }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .in('id', productIds);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(
        `${variables.productIds.length} produit(s) ${variables.isActive ? 'activé(s)' : 'désactivé(s)'}`
      );
    },
    onError: (error: Error) => {
      console.error('Error batch toggling products:', error);
      toast.error('Erreur lors de l\'activation/désactivation');
    },
  });
};

// Hook pour supprimer plusieurs produits
export const useBatchDeleteProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', productIds);

      if (error) throw error;
    },
    onSuccess: (_, productIds) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${productIds.length} produit(s) supprimé(s)`);
    },
    onError: (error: Error) => {
      console.error('Error batch deleting products:', error);
      toast.error('Erreur lors de la suppression en lot');
    },
  });
};

// Hook pour importer des produits depuis CSV
export const useImportProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (products: any[]) => {
      const { error } = await supabase
        .from('products')
        .upsert(products, { onConflict: 'barcode' });

      if (error) throw error;
      return products.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${count} produit(s) importé(s) avec succès`);
    },
    onError: (error: Error) => {
      console.error('Error importing products:', error);
      toast.error('Erreur lors de l\'import des produits');
    },
  });
};

// Hook pour ajuster le stock en lot
export const useBatchAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adjustments: { productId: string; quantity: number; operation: 'add' | 'set' }[]) => {
      for (const adj of adjustments) {
        if (adj.operation === 'add') {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', adj.productId)
            .single();

          if (product) {
            await supabase
              .from('products')
              .update({ stock: (product.stock || 0) + adj.quantity })
              .eq('id', adj.productId);
          }
        } else {
          await supabase
            .from('products')
            .update({ stock: adj.quantity })
            .eq('id', adj.productId);
        }
      }
    },
    onSuccess: (_, adjustments) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Stock ajusté pour ${adjustments.length} produit(s)`);
    },
    onError: (error: Error) => {
      console.error('Error adjusting stock:', error);
      toast.error('Erreur lors de l\'ajustement du stock');
    },
  });
};
