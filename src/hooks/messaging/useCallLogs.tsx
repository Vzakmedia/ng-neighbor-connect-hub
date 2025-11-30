import { useState, useEffect } from 'react';
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

  const fetchCallLogs = async () => {
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
  };

  useEffect(() => {
    if (conversationId) {
      fetchCallLogs();
    }
  }, [conversationId]);

  // Subscribe to real-time updates
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
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Call log change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setCallLogs(prev => [payload.new as CallLog, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCallLogs(prev => 
              prev.map(log => 
                log.id === payload.new.id ? payload.new as CallLog : log
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCallLogs(prev => 
              prev.filter(log => log.id !== payload.old.id)
            );
          }
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
    refetch: fetchCallLogs
  };
};