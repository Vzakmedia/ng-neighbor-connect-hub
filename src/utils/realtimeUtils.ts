import { supabase } from '@/integrations/supabase/client';

interface SafeSubscriptionOptions {
  channelName: string;
  onError?: () => void;
  pollInterval?: number;
  debugName?: string;
}

// Connection diagnostics
interface ConnectionDiagnostics {
  channelName: string;
  status: string;
  error?: string;
  timestamp: number;
  isIOS: boolean;
}

const connectionDiagnostics: ConnectionDiagnostics[] = [];
const MAX_DIAGNOSTICS = 50;

export const getConnectionDiagnostics = () => [...connectionDiagnostics];

const logDiagnostic = (diagnostic: ConnectionDiagnostics) => {
  connectionDiagnostics.push(diagnostic);
  if (connectionDiagnostics.length > MAX_DIAGNOSTICS) {
    connectionDiagnostics.shift();
  }
};

// Global circuit breaker for all subscriptions
let globalFailureCount = 0;
const MAX_FAILURES = 3; // Reduced from 5
const CIRCUIT_BREAKER_TIMEOUT = 60000; // Increased to 1 minute
let circuitBreakerOpenUntil = 0;

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map<string, any>();
const subscriptionCleanupTimers = new Map<string, NodeJS.Timeout>();

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
  
  // Detect iOS - realtime might be disabled
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Try to set up real-time subscription
  let channel: any = null;
  let subscription: any = null;
  
  try {
    channel = supabase.channel(channelName);
    
    // Enhanced error handling to prevent console errors
    if (channel.conn?.conn) {
      const originalOnError = channel.conn.conn.onerror;
      channel.conn.conn.onerror = (event: Event) => {
        // Prevent the error from propagating to console
        event.preventDefault?.();
        event.stopPropagation?.();
        
        const errorMsg = event instanceof ErrorEvent ? event.message : 'WebSocket error';
        
        logDiagnostic({
          channelName,
          status: 'WEBSOCKET_ERROR',
          error: errorMsg,
          timestamp: Date.now(),
          isIOS
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.debug(`${debugName}: WebSocket error:`, errorMsg);
        }
        
        // Only call custom error handler if provided
        if (options.onError) {
          options.onError();
        }
        
        // Start polling as fallback
        if (!pollingInterval) {
          startPolling();
        }
        
        // Call original handler if it exists
        if (originalOnError) {
          originalOnError.call(this, event);
        }
      };
    }
    
    subscription = channelBuilder(channel).subscribe((status: string) => {
      logDiagnostic({
        channelName,
        status,
        timestamp: Date.now(),
        isIOS
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.debug(`${debugName}: Subscription status:`, status);
      }
      
      if (status === 'SUBSCRIBED') {
        isRealTimeConnected = true;
        if (process.env.NODE_ENV === 'development') {
          console.debug(`${debugName}: Real-time connected, stopping polling`);
        }
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        isRealTimeConnected = false;
        
        if (process.env.NODE_ENV === 'development') {
          console.debug(`${debugName}: Connection ${status}, reason: ${
            status === 'TIMED_OUT' ? 'Connection timeout (network issue or server unavailable)' :
            status === 'CLOSED' ? 'Connection closed (possibly by server)' :
            'Channel error (configuration or permission issue)'
          }`);
        }
        
        startPolling();
      }
    });
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    
    logDiagnostic({
      channelName,
      status: 'SETUP_ERROR',
      error: errorMessage,
      timestamp: Date.now(),
      isIOS
    });
    
    // Handle iOS SecurityError gracefully
    if (error?.name === 'SecurityError' || error?.message?.includes('insecure') || error?.message?.includes('WebSocket')) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`${debugName}: Realtime unavailable (SecurityError) - this is normal on iOS`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`${debugName}: Real-time setup failed:`, errorMessage);
      }
    }
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
      // Clear cleanup timer
      const cleanupTimer = subscriptionCleanupTimers.get(channelName);
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        subscriptionCleanupTimers.delete(channelName);
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
  
  // Add cleanup timer to prevent stale subscriptions
  const cleanupTimer = setTimeout(() => {
    activeSubscriptions.delete(channelName);
    subscriptionCleanupTimers.delete(channelName);
  }, 300000); // 5 minutes
  subscriptionCleanupTimers.set(channelName, cleanupTimer);
  
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