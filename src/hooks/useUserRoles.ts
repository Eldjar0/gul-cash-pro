import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'manager' | 'cashier' | 'viewer';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

// Hook pour obtenir les rôles de l'utilisateur connecté
export const useCurrentUserRoles = () => {
  return useQuery({
    queryKey: ['user-roles', 'current'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserRole[];
    },
  });
};

// Hook pour vérifier si l'utilisateur a un rôle spécifique
export const useHasRole = (role: AppRole) => {
  const { data: roles = [], isLoading } = useCurrentUserRoles();
  return {
    hasRole: roles.some(r => r.role === role),
    isLoading,
  };
};

// Hook pour vérifier si l'utilisateur est admin
export const useIsAdmin = () => {
  return useHasRole('admin');
};

// Hook pour obtenir tous les rôles (admin uniquement)
export const useAllUserRoles = () => {
  return useQuery({
    queryKey: ['user-roles', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;
      return data as UserRole[];
    },
  });
};

// Hook pour assigner un rôle (admin uniquement)
export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Rôle assigné avec succès');
    },
    onError: (error: Error) => {
      console.error('Error assigning role:', error);
      toast.error('Erreur lors de l\'assignation du rôle');
    },
  });
};

// Hook pour retirer un rôle (admin uniquement)
export const useRemoveRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Rôle retiré avec succès');
    },
    onError: (error: Error) => {
      console.error('Error removing role:', error);
      toast.error('Erreur lors du retrait du rôle');
    },
  });
};