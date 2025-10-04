import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from './useUserRoles';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role: AppRole;
  permission_id: string;
  created_at: string;
}

export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module, name');

      if (error) throw error;
      return data as Permission[];
    },
  });
};

export const useRolePermissions = (role?: AppRole) => {
  return useQuery({
    queryKey: ['role-permissions', role],
    queryFn: async () => {
      let query = supabase
        .from('role_permissions')
        .select('*, permissions(*)');

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!role,
  });
};

export const useAssignPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, permissionId }: { role: AppRole; permissionId: string }) => {
      const { error } = await supabase
        .from('role_permissions')
        .insert({ role, permission_id: permissionId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permission assignée');
    },
    onError: (error: Error) => {
      console.error('Error assigning permission:', error);
      toast.error('Erreur lors de l\'assignation');
    },
  });
};

export const useRevokePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, permissionId }: { role: AppRole; permissionId: string }) => {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role)
        .eq('permission_id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permission retirée');
    },
    onError: (error: Error) => {
      console.error('Error revoking permission:', error);
      toast.error('Erreur lors du retrait');
    },
  });
};
