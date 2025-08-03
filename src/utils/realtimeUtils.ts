import { supabase } from '@/integrations/supabase/client';

interface SafeSubscriptionOptions {
  channelName: string;
  onError?: () => void;
  pollInterval?: number;
  debugName?: string;
}

// Circuit breaker to prevent overwhelming the system
let failureCount = 0;
const MAX_FAILURES = 10; // Increased from 5 to 10
const CIRCUIT_BREAKER_TIMEOUT = 30000; // Reduced from 1 minute to 30 seconds
let circuitBreakerOpenUntil = 0;

export const createSafeSubscription = (
  channelBuilder: (channel: any) => any,
  options: SafeSubscriptionOptions
) => {
  const { channelName, onError, pollInterval = 60000, debugName = 'unknown' } = options; // Increased to 60 seconds to reduce load
  
  console.log(`${debugName}: Attempting to create safe subscription...`);
  
  let pollingInterval: NodeJS.Timeout | null = null;
  let isRealTimeConnected = false;
  
  // Start immediate polling fallback with circuit breaker
  const startPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    // Check circuit breaker
    if (Date.now() < circuitBreakerOpenUntil) {
      console.log(`${debugName}: Circuit breaker open, skipping polling`);
      return;
    }
    
    if (onError && !isRealTimeConnected) {
      console.log(`${debugName}: Starting polling fallback every ${pollInterval/1000} seconds`);
      // Add a small delay before starting to prevent immediate spam
      setTimeout(() => {
        pollingInterval = setInterval(() => {
          try {
            console.log(`${debugName}: Polling for updates...`);
            onError();
            // Reset failure count on successful poll
            failureCount = 0;
          } catch (error) {
            failureCount++;
            console.error(`${debugName}: Polling error (${failureCount}/${MAX_FAILURES}):`, error);
            
            if (failureCount >= MAX_FAILURES) {
              console.warn(`${debugName}: Too many failures, opening circuit breaker`);
              circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
              if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
              }
            }
          }
        }, pollInterval);
      }, 2000); // 2 second delay before starting
    }
  };
  
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      console.log(`${debugName}: Stopped polling - real-time connected`);
    }
  };
  
  try {
    const channel = supabase.channel(channelName);
    const subscription = channelBuilder(channel);
    
    // Start polling immediately in case real-time doesn't work
    startPolling();
    
    const subscriptionResult = subscription.subscribe((status: string) => {
      console.log(`${debugName}: Subscription status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        console.log(`${debugName}: Successfully subscribed to realtime updates`);
        isRealTimeConnected = true;
        stopPolling();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.warn(`${debugName}: Subscription failed with status ${status}, using polling fallback`);
        isRealTimeConnected = false;
        startPolling();
      }
    });
    
    // Return an object with both the channel and subscription for proper cleanup
    return {
      channel,
      subscription: subscriptionResult,
      unsubscribe: () => {
        try {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
          supabase.removeChannel(channel);
          console.log(`${debugName}: Successfully unsubscribed and removed channel`);
        } catch (error) {
          console.error(`${debugName}: Error during unsubscribe:`, error);
        }
      }
    };
  } catch (error) {
    console.error(`${debugName}: Error creating subscription:`, error);
    
    // Still start polling if subscription creation fails
    startPolling();
    
    // Return a dummy subscription object
    return {
      channel: null,
      subscription: null,
      unsubscribe: () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        console.log(`${debugName}: Dummy subscription unsubscribe called`);
      }
    };
  }
};

export const cleanupSafeSubscription = (subscriptionObject: any) => {
  try {
    if (subscriptionObject && typeof subscriptionObject.unsubscribe === 'function') {
      subscriptionObject.unsubscribe();
    }
  } catch (error) {
    console.error('Error during subscription cleanup:', error);
  }
};

// Global flag to disable all realtime features if needed
export const isRealtimeDisabled = () => {
  return (window as any).DISABLE_REALTIME === true;
};

export const disableRealtime = () => {
  (window as any).DISABLE_REALTIME = true;
  console.warn('Realtime features have been globally disabled due to connection issues');
};