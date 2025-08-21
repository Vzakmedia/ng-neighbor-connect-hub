import { supabase } from '@/integrations/supabase/client';

interface SafeSubscriptionOptions {
  channelName: string;
  onError?: () => void;
  pollInterval?: number;
  debugName?: string;
}

// Global circuit breaker for all subscriptions
let globalFailureCount = 0;
const MAX_FAILURES = 3; // Reduced from 5
const CIRCUIT_BREAKER_TIMEOUT = 60000; // Increased to 1 minute
let circuitBreakerOpenUntil = 0;

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map<string, any>();

export const createSafeSubscription = (
  channelBuilder: (channel: any) => any,
  options: SafeSubscriptionOptions
) => {
  const { channelName, onError, pollInterval = 60000, debugName = 'unknown' } = options; // Increased default interval
  
  // Prevent duplicate subscriptions
  if (activeSubscriptions.has(channelName)) {
    console.log(`${debugName}: Subscription already exists for ${channelName}, returning existing`);
    return activeSubscriptions.get(channelName);
  }
  
  console.log(`${debugName}: Creating safe subscription...`);
  
  let pollingInterval: NodeJS.Timeout | null = null;
  let isRealTimeConnected = false;
  
  // Start polling fallback with global circuit breaker
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
          if (globalFailureCount > 0) {
            globalFailureCount = 0;
            console.log(`${debugName}: Polling successful, failure count reset`);
          }
        } catch (error) {
          globalFailureCount++;
          console.error(`${debugName}: Polling error (${globalFailureCount}/${MAX_FAILURES}):`, error);
          
          if (globalFailureCount >= MAX_FAILURES) {
            console.warn(`${debugName}: Circuit breaker opening due to ${globalFailureCount} failures`);
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
  
  // Only start polling if real-time is disabled or connection fails
  // startPolling();
  
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
      // Remove from active subscriptions
      activeSubscriptions.delete(channelName);
      console.log(`${debugName}: Unsubscribed successfully`);
    } catch (error) {
      console.error(`${debugName}: Error during unsubscribe:`, error);
    }
  };
  
  const subscriptionObj = {
    channel,
    subscription,
    unsubscribe
  };
  
  // Track this subscription
  activeSubscriptions.set(channelName, subscriptionObj);
  
  return subscriptionObj;
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