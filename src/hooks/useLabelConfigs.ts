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
      return data as LabelConfiguration[];
    },
  });

  const createConfig = useMutation({
    mutationFn: async (config: { name: string; format: StickerFormat; template: any }) => {
      const { data, error } = await supabase
        .from('label_configurations')
        .insert({
          name: config.name,
          format: config.format,
          template: config.template,
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
      const { data, error } = await supabase
        .from('label_configurations')
        .update(updates)
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
