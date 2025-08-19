import { supabase } from '@/integrations/supabase/client';

interface SafeSubscriptionOptions {
  channelName: string;
  onError?: () => void;
  pollInterval?: number;
  debugName?: string;
}

// Simplified circuit breaker
let failureCount = 0;
const MAX_FAILURES = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000;
let circuitBreakerOpenUntil = 0;

export const createSafeSubscription = (
  channelBuilder: (channel: any) => any,
  options: SafeSubscriptionOptions
) => {
  const { channelName, onError, pollInterval = 30000, debugName = 'unknown' } = options;
  
  console.log(`${debugName}: Creating safe subscription...`);
  
  let pollingInterval: NodeJS.Timeout | null = null;
  let isRealTimeConnected = false;
  
  // Start polling fallback with circuit breaker
  const startPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    // Check circuit breaker
    if (Date.now() < circuitBreakerOpenUntil) {
      console.log(`${debugName}: Circuit breaker open, skipping polling`);
      return;
    }
    
    if (onError && !isRealTimeConnected) {
      console.log(`${debugName}: Starting polling fallback`);
      pollingInterval = setInterval(() => {
        try {
          onError();
          // Reset failure count on successful poll
          if (failureCount > 0) {
            failureCount = 0;
            console.log(`${debugName}: Polling successful, failure count reset`);
          }
        } catch (error) {
          failureCount++;
          console.error(`${debugName}: Polling error (${failureCount}/${MAX_FAILURES}):`, error);
          
          if (failureCount >= MAX_FAILURES) {
            console.warn(`${debugName}: Circuit breaker opening due to ${failureCount} failures`);
            circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
            if (pollingInterval) {
              clearInterval(pollingInterval);
              pollingInterval = null;
            }
          }
        }
      }, pollInterval);
    }
  };
  
  // Always start with polling for reliability
  startPolling();
  
  // Try to set up real-time subscription
  let channel: any = null;
  let subscription: any = null;
  
  try {
    channel = supabase.channel(channelName);
    subscription = channelBuilder(channel).subscribe((status: string) => {
      console.log(`${debugName}: Subscription status:`, status);
      
      if (status === 'SUBSCRIBED') {
        isRealTimeConnected = true;
        console.log(`${debugName}: Real-time connected, stopping polling`);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        isRealTimeConnected = false;
        console.info(`${debugName}: Real-time connection ${status.toLowerCase()}, using polling mode`);
        startPolling();
      }
    });
  } catch (error) {
    console.error(`${debugName}: Real-time setup failed, using polling only:`, error);
    isRealTimeConnected = false;
  }
  
  const unsubscribe = () => {
    try {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
      console.log(`${debugName}: Unsubscribed successfully`);
    } catch (error) {
      console.error(`${debugName}: Error during unsubscribe:`, error);
    }
  };
  
  return {
    channel,
    subscription,
    unsubscribe
  };
};

export const cleanupSafeSubscription = (subscription: any) => {
  if (subscription && typeof subscription.unsubscribe === 'function') {
    subscription.unsubscribe();
  }
};

// Utility to check if realtime is disabled
export const isRealtimeDisabled = (): boolean => {
  return !!(window as any).DISABLE_REALTIME;
};

export const disableRealtime = (): void => {
  (window as any).DISABLE_REALTIME = true;
};