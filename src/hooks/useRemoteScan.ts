import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface RemoteScanSession {
  id: string;
  session_code: string;
  cashier_id: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

export interface RemoteScannedItem {
  id: string;
  session_id: string;
  barcode: string;
  quantity: number;
  processed: boolean;
  created_at: string;
}

export const useCreateScanSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Generate unique session code
      const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { data, error } = await supabase
        .from('remote_scan_sessions')
        .insert({
          session_code: sessionCode,
          cashier_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as RemoteScanSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remote-scan-sessions'] });
      toast.success('Session de scan créée');
    },
    onError: (error: Error) => {
      console.error('Error creating scan session:', error);
      toast.error('Erreur lors de la création de la session');
    },
  });
};

export const useCloseScanSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('remote_scan_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remote-scan-sessions'] });
      toast.success('Session fermée');
    },
  });
};

export const useScanSession = (sessionCode?: string) => {
  return useQuery({
    queryKey: ['remote-scan-session', sessionCode],
    queryFn: async () => {
      if (!sessionCode) throw new Error('Session code required');

      const { data, error } = await supabase
        .from('remote_scan_sessions')
        .select('*')
        .eq('session_code', sessionCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as RemoteScanSession | null;
    },
    enabled: !!sessionCode,
  });
};

export const useAddScannedItem = () => {
  return useMutation({
    mutationFn: async ({ sessionId, barcode, quantity = 1 }: { sessionId: string; barcode: string; quantity?: number }) => {
      const { error } = await supabase
        .from('remote_scanned_items')
        .insert({
          session_id: sessionId,
          barcode,
          quantity,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Article ajouté');
    },
    onError: (error: Error) => {
      console.error('Error adding scanned item:', error);
      toast.error('Erreur lors de l\'ajout');
    },
  });
};

export const useUnprocessedScannedItems = (sessionId?: string) => {
  return useQuery({
    queryKey: ['remote-scanned-items', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('remote_scanned_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('processed', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as RemoteScannedItem[];
    },
    enabled: !!sessionId,
    refetchInterval: 1000, // Poll every second
  });
};

export const useMarkItemProcessed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('remote_scanned_items')
        .update({ processed: true })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: ['remote-scanned-items'] });
    },
  });
};

// Subscribe to realtime updates
export const useRealtimeScannedItems = (sessionId: string | undefined, onNewItem: (item: RemoteScannedItem) => void) => {
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`remote-scan-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'remote_scanned_items',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('New scanned item:', payload.new);
          onNewItem(payload.new as RemoteScannedItem);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, onNewItem]);
};
