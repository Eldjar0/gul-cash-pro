import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'suppliers')
        .maybeSingle();

      if (data?.value) {
        return (data.value as any).suppliers as Supplier[];
      }

      return [];
    },
  });
};

export const useSaveSuppliers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suppliers: Supplier[]) => {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            key: 'suppliers',
            value: { suppliers } as any,
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseurs enregistrés');
    },
    onError: (error: Error) => {
      console.error('Error saving suppliers:', error);
      toast.error('Erreur lors de l\'enregistrement');
    },
  });
};
