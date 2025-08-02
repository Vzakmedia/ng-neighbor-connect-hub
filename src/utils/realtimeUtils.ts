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
    
    const subscriptionResult = subscription.subscribe((status: string) => {
      console.log(`${debugName}: Subscription status: ${status}`);
      
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error(`${debugName}: Subscription failed with status ${status}`);
        
        if (onError) {
          setTimeout(onError, 2000); // Delayed retry
        }
      } else if (status === 'SUBSCRIBED') {
        console.log(`${debugName}: Successfully subscribed to realtime updates`);
      }
    });
    
    // Return an object with both the channel and subscription for proper cleanup
    return {
      channel,
      subscription: subscriptionResult,
      unsubscribe: () => {
        try {
          supabase.removeChannel(channel);
          console.log(`${debugName}: Successfully unsubscribed and removed channel`);
        } catch (error) {
          console.error(`${debugName}: Error during unsubscribe:`, error);
        }
      }
    };
  } catch (error) {
    console.error(`${debugName}: Error creating subscription:`, error);
    
    // Return a dummy subscription object
    return {
      channel: null,
      subscription: null,
      unsubscribe: () => console.log(`${debugName}: Dummy subscription unsubscribe called`)
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