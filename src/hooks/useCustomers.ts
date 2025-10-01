import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  vat_number?: string;
  is_active?: boolean;
  loyalty_points?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Customer[];
    },
  });
};

export const useSearchCustomers = (searchTerm: string) => {
  return useQuery({
    queryKey: ['customers', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,vat_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('name')
        .limit(10);

      if (error) throw error;
      return data as Customer[];
    },
    enabled: searchTerm.trim().length > 0,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: 'Client créé',
        description: 'Le client a été créé avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error creating customer:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le client.',
        variant: 'destructive',
      });
    },
  });
};
