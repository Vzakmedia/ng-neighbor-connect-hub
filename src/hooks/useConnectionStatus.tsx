import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNativeNetwork } from '@/hooks/mobile/useNativeNetwork';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'offline';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const { isOnline } = useNativeNetwork();

  useEffect(() => {
    if (!isOnline) {
      setStatus('offline');
      return;
    }

    // Create a test channel to monitor connection
    const channel = supabase.channel('connection-monitor');

    const checkConnection = () => {
      const channelStatus = channel.state;
      
      if (channelStatus === 'joined') {
        setStatus('connected');
      } else if (channelStatus === 'joining') {
        setStatus('connecting');
      } else {
        setStatus('disconnected');
      }
    };

    // Subscribe and monitor status
    channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        } else if (status === 'TIMED_OUT') {
          setStatus('disconnected');
        } else if (status === 'CLOSED') {
          setStatus('disconnected');
        }
      });

    // Check status periodically
    const interval = setInterval(checkConnection, 2000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isOnline]);

  return { status, isOnline };
};
