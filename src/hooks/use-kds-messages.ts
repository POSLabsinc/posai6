import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface KDSMessageRow {
  id: string;
  message_id: string;
  message_text: string;
  store_id: string;
  terminal_id: string;
  terminal_name: string | null;
  employee_id: string;
  employee_name: string;
  employee_role: string | null;
  table_id: string | null;
  table_number: string | null;
  linked_order_id: string | null;
  linked_order_number: number | null;
  linked_order_ids: string[] | null;
  link_type: string | null;
  status: 'pending' | 'acknowledged';
  acknowledged_at: string | null;
  created_at: string;
}

async function fetchKDSMessages(): Promise<KDSMessageRow[]> {
  const { data, error } = await (supabase as any)
    .from('kds_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    ...m,
    linked_order_ids: Array.isArray(m.linked_order_ids) ? m.linked_order_ids : [],
    status: m.status || 'pending',
  }));
}

export function useKDSMessages() {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['kds-messages'],
    queryFn: fetchKDSMessages,
    staleTime: 5_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('kds-messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kds_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['kds-messages'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const insertMessage = useMutation({
    mutationFn: async (msg: Omit<KDSMessageRow, 'id' | 'created_at'>) => {
      const { error } = await (supabase as any).from('kds_messages').insert(msg);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kds-messages'] }),
  });

  const acknowledgeMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await (supabase as any)
        .from('kds_messages')
        .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
        .eq('message_id', messageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kds-messages'] }),
  });

  return {
    messages,
    isLoading,
    error,
    insertMessage: insertMessage.mutateAsync,
    acknowledgeMessage: acknowledgeMessage.mutateAsync,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['kds-messages'] }),
  };
}
