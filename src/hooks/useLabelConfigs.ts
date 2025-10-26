import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { StickerFormat } from '@/components/inventory/A4LabelLayout';

interface LabelConfiguration {
  id: string;
  name: string;
  format: StickerFormat;
  template: any;
  created_at: string;
}

export const useLabelConfigs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['label-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('label_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast the JSONB fields to proper types
      return (data || []).map(item => ({
        ...item,
        format: item.format as unknown as StickerFormat,
        template: item.template as any,
      })) as LabelConfiguration[];
    },
  });

  const createConfig = useMutation({
    mutationFn: async (config: { name: string; format: StickerFormat; template: any }) => {
      const { data, error } = await supabase
        .from('label_configurations')
        .insert({
          name: config.name,
          format: config.format as any,
          template: config.template as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-configurations'] });
      toast({
        title: 'Configuration sauvegardée',
        description: 'La configuration d\'étiquettes a été enregistrée avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LabelConfiguration> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.format !== undefined) updateData.format = updates.format as any;
      if (updates.template !== undefined) updateData.template = updates.template as any;
      
      const { data, error } = await supabase
        .from('label_configurations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-configurations'] });
      toast({
        title: 'Configuration mise à jour',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('label_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-configurations'] });
      toast({
        title: 'Configuration supprimée',
        description: 'La configuration a été supprimée avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    configs,
    isLoading,
    createConfig: createConfig.mutate,
    updateConfig: updateConfig.mutate,
    deleteConfig: deleteConfig.mutate,
  };
};
