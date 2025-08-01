import { supabase } from '@/integrations/supabase/client';

interface SafeSubscriptionOptions {
  channelName: string;
  onError?: () => void;
  pollInterval?: number;
  debugName?: string;
}

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map<string, any>();

export const createSafeSubscription = (
  channelBuilder: (channel: any) => any,
  options: SafeSubscriptionOptions
) => {
  const { channelName, onError, pollInterval = 30000, debugName = 'unknown' } = options;
  
  console.log(`${debugName}: Attempting to create safe subscription...`);
  
  // Clean up any existing subscription with the same name
  if (activeSubscriptions.has(channelName)) {
    console.log(`${debugName}: Cleaning up existing subscription for ${channelName}`);
    cleanupSafeSubscription(channelName, debugName);
  }
  
  try {
    // Create unique channel name with timestamp to avoid conflicts
    const uniqueChannelName = `${channelName}_${Date.now()}`;
    const channel = supabase.channel(uniqueChannelName);
    const subscription = channelBuilder(channel);
    
    let retryCount = 0;
    const maxRetries = 3;
    
    const subscribeWithRetry = () => {
      return subscription.subscribe((status: string) => {
        console.log(`${debugName}: Subscription status: ${status}`);
        
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`${debugName}: Subscription failed with status ${status}`);
          
          // Retry connection up to maxRetries times
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`${debugName}: Retrying subscription (${retryCount}/${maxRetries})...`);
            
            setTimeout(() => {
              // Remove the failed channel and create a new one
              supabase.removeChannel(channel);
              const newChannelName = `${channelName}_retry_${Date.now()}`;
              const newChannel = supabase.channel(newChannelName);
              const newSubscription = channelBuilder(newChannel);
              activeSubscriptions.set(channelName, newSubscription);
              subscribeWithRetry();
            }, 2000 * retryCount); // Exponential backoff
          } else {
            console.error(`${debugName}: Max retries exceeded, subscription failed permanently`);
            if (onError) {
              onError();
            }
          }
        } else if (status === 'SUBSCRIBED') {
          console.log(`${debugName}: Successfully subscribed to realtime updates`);
          retryCount = 0; // Reset retry count on successful connection
        }
      });
    };
    
    activeSubscriptions.set(channelName, subscription);
    subscribeWithRetry();
    
    return subscription;
  } catch (error) {
    console.error(`${debugName}: Error creating subscription:`, error);
    
    if (onError) {
      setTimeout(onError, 1000);
    }
    
    // Return a dummy subscription object
    return {
      unsubscribe: () => console.log(`${debugName}: Dummy subscription unsubscribe called`)
    };
  }
};

export const cleanupSafeSubscription = (channelName: string, debugName?: string) => {
  try {
    console.log(`${debugName || 'unknown'}: Cleaning up subscription for ${channelName}`);
    
    // Get the subscription from our tracking map
    const subscription = activeSubscriptions.get(channelName);
    if (subscription) {
      // Unsubscribe from the subscription
      if (typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
      
      // Remove from our tracking map
      activeSubscriptions.delete(channelName);
    }
    
    // Clean up any channels that match the channelName pattern
    const channels = supabase.getChannels();
    channels.forEach(channel => {
      if (channel.topic.includes(channelName)) {
        supabase.removeChannel(channel);
      }
    });
    
    console.log(`${debugName || 'unknown'}: Successfully cleaned up subscription`);
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