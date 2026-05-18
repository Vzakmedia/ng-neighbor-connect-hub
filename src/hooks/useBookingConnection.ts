import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface UseBookingConnectionReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  lastUpdate: Date | null;
  reconnect: () => void;
}

export const useBookingConnection = (): UseBookingConnectionReturn => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    let testChannel: any = null;
    let reconnectTimeout: NodeJS.Timeout;

    const setupConnectionMonitor = () => {
      // Tear down any existing channel before creating a new one
      if (testChannel) {
        supabase.removeChannel(testChannel);
      }
      // Create a test channel to monitor connection health
      testChannel = supabase
        .channel(`booking-connection-test-${reconnectAttempts}`)
        .subscribe((channelStatus) => {
          if (channelStatus === 'SUBSCRIBED') {
            setStatus('connected');
            setLastUpdate(new Date());
            setReconnectAttempts(0);
          } else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
            setStatus('error');

            // Exponential backoff for reconnection
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeout = setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
            }, delay);
          } else if (channelStatus === 'CLOSED') {
            setStatus('disconnected');
          } else {
            setStatus('connecting');
          }
        });
    };

    setupConnectionMonitor();

    // Periodic health check — use ref to avoid stale closure
    const healthCheckInterval = setInterval(() => {
      if (statusRef.current === 'connected') {
        setLastUpdate(new Date());
      }
    }, 10000); // Check every 10 seconds

    return () => {
      if (testChannel) {
        supabase.removeChannel(testChannel);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      clearInterval(healthCheckInterval);
    };
  }, [reconnectAttempts]);

  const reconnect = () => {
    setStatus('connecting');
    // Incrementing reconnectAttempts triggers the useEffect to tear down and recreate the channel
    setReconnectAttempts(prev => prev + 1);
  };

  return {
    status,
    isConnected: status === 'connected',
    lastUpdate,
    reconnect,
  };
};
