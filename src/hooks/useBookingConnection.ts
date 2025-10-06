import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let testChannel: any = null;
    let reconnectTimeout: NodeJS.Timeout;

    const setupConnectionMonitor = () => {
      // Create a test channel to monitor connection health
      testChannel = supabase
        .channel('booking-connection-test')
        .subscribe((status) => {
          console.log('Booking connection status:', status);
          
          if (status === 'SUBSCRIBED') {
            setStatus('connected');
            setLastUpdate(new Date());
            setReconnectAttempts(0);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setStatus('error');
            
            // Exponential backoff for reconnection
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeout = setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              reconnect();
            }, delay);
          } else if (status === 'CLOSED') {
            setStatus('disconnected');
          } else {
            setStatus('connecting');
          }
        });
    };

    setupConnectionMonitor();

    // Periodic health check
    const healthCheckInterval = setInterval(() => {
      if (status === 'connected') {
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
    console.log('Manually reconnecting booking connection...');
    setStatus('connecting');
    setReconnectAttempts(0);
    
    // Force refresh by creating new subscription
    window.location.reload();
  };

  return {
    status,
    isConnected: status === 'connected',
    lastUpdate,
    reconnect,
  };
};
