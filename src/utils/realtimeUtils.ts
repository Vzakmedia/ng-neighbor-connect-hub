import { supabase } from '@/integrations/supabase/client';

interface SafeSubscriptionOptions {
  channelName: string;
  onError?: () => void;
  pollInterval?: number;
  debugName?: string;
}

export const createSafeSubscription = (
  channelBuilder: (channel: any) => any,
  options: SafeSubscriptionOptions
) => {
  const { channelName, onError, pollInterval = 60000, debugName = 'unknown' } = options;
  
  console.log(`${debugName}: Attempting to create safe subscription...`);
  
  try {
    const channel = supabase.channel(channelName);
    const subscription = channelBuilder(channel);
    
    return subscription.subscribe((status: string) => {
      console.log(`${debugName}: Subscription status: ${status}`);
      
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error(`${debugName}: Subscription failed with status ${status}, disabling polling to prevent refresh loops`);
        
        // Only call onError once, don't set up polling that causes constant refreshes
        if (onError) {
          setTimeout(onError, 1000); // Single delayed call
        }
        
        // Do NOT setup polling fallback to prevent constant refreshes
        console.log(`${debugName}: Polling fallback disabled to prevent refresh loops`);
      } else if (status === 'SUBSCRIBED') {
        console.log(`${debugName}: Successfully subscribed to realtime updates`);
        // Clear any existing polling since realtime is working
        const pollKey = `${channelName}_poll`;
        if ((window as any)[pollKey]) {
          clearInterval((window as any)[pollKey]);
          delete (window as any)[pollKey];
          console.log(`${debugName}: Cleared polling fallback - realtime working`);
        }
      }
    });
  } catch (error) {
    console.error(`${debugName}: Error creating subscription:`, error);
    
    // Immediate fallback to polling
    // Disable immediate polling fallback to prevent constant refreshes
    console.log(`${debugName}: Polling fallback disabled due to subscription error`);
    
    // Return a dummy subscription object
    return {
      unsubscribe: () => console.log(`${debugName}: Dummy subscription unsubscribe called`)
    };
  }
};

export const cleanupSafeSubscription = (channelName: string, debugName?: string) => {
  try {
    // Remove the Supabase channel
    const channel = supabase.channel(channelName);
    supabase.removeChannel(channel);
    
    // Clear any polling fallback
    const pollKey = `${channelName}_poll`;
    if ((window as any)[pollKey]) {
      clearInterval((window as any)[pollKey]);
      delete (window as any)[pollKey];
      console.log(`${debugName || 'unknown'}: Cleaned up polling fallback`);
    }
  } catch (error) {
    console.error(`${debugName || 'unknown'}: Error during cleanup:`, error);
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