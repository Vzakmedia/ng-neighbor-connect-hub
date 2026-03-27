import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CallLog {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'voice' | 'video';
  call_status: 'missed' | 'answered' | 'declined' | 'failed' | 'ended';
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export const useCallLogs = (conversationId: string) => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  // Stable ref so the realtime callback always calls the latest fetch
  const fetchRef = useRef<() => Promise<void>>();

  const fetchCallLogs = useCallback(async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setCallLogs((data as CallLog[]) || []);
    } catch (error) {
      console.error('Error fetching call logs:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Keep the ref always pointing at the latest fetch function
  useEffect(() => {
    fetchRef.current = fetchCallLogs;
  });

  // Initial fetch
  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

  // Realtime subscription — refetch on any change so we always have fresh data.
  // Manual state patching from payload is unreliable for UPDATE events unless the
  // table has REPLICA IDENTITY FULL set in Postgres.
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`call_logs:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_logs',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return {
    callLogs,
    loading,
    refetch: fetchCallLogs,
  };
};
