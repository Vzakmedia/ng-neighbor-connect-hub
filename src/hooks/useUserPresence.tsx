import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { createSafeSubscription } from '@/utils/realtimeUtils';

interface UserPresence {
  [userId: string]: {
    user_id: string;
    online_at: string;
    user_name?: string;
    avatar_url?: string;
  }[];
}

interface PresenceState {
  [userId: string]: {
    user_id: string;
    online_at: string;
    user_name?: string;
    avatar_url?: string;
  };
}

export const useUserPresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [presenceState, setPresenceState] = useState<PresenceState>({});

  const updatePresenceState = useCallback((presences: UserPresence) => {
    const flattened: PresenceState = {};
    const userIds = new Set<string>();

    Object.entries(presences).forEach(([key, presence]) => {
      if (presence && presence.length > 0) {
        const latestPresence = presence[0]; // Get the most recent presence
        flattened[latestPresence.user_id] = latestPresence;
        userIds.add(latestPresence.user_id);
      }
    });

    console.log('Updating presence state:', { userIds: Array.from(userIds), flattened });
    setPresenceState(flattened);
    setOnlineUsers(userIds);
  }, []);

  useEffect(() => {
    if (!user) return;

    let subscription: any = null;

    const initializePresence = async () => {
      try {
        subscription = createSafeSubscription(
          (channel) => {
            return channel
              .on('presence', { event: 'sync' }, () => {
                try {
                  const presences = channel.presenceState() as UserPresence;
                  console.log('Presence sync - raw presences:', presences);
                  updatePresenceState(presences);
                } catch (error) {
                  console.error('Error syncing presence:', error);
                }
              })
              .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('User joined:', key, newPresences);
                // Manually sync after join to get updated state
                const presences = channel.presenceState() as UserPresence;
                updatePresenceState(presences);
              })
              .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('User left:', key, leftPresences);
                // Manually sync after leave to get updated state  
                const presences = channel.presenceState() as UserPresence;
                updatePresenceState(presences);
              })
              .subscribe(async (status) => {
                console.log('Presence subscription status:', status);
                if (status !== 'SUBSCRIBED') return;

                try {
                  // Get user profile data
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('user_id', user.id)
                    .maybeSingle();

                  // Track current user presence
                  const presenceTrackStatus = await channel.track({
                    user_id: user.id,
                    online_at: new Date().toISOString(),
                    user_name: profile?.full_name || 'Anonymous',
                    avatar_url: profile?.avatar_url || null,
                  });

                  console.log('Presence track status:', presenceTrackStatus);
                  
                  // Also get current presence state after we track
                  const currentPresences = channel.presenceState() as UserPresence;
                  updatePresenceState(currentPresences);
                } catch (error) {
                  console.error('Error tracking presence:', error);
                }
              });
          },
          {
            channelName: 'global_user_presence', // Use shared channel for all users
            debugName: 'UserPresence',
            onError: () => {
              // Fallback: Don't update presence state on polling
              console.log('UserPresence: Using polling fallback (presence not available)');
            },
          }
        );
      } catch (error) {
        console.error('UserPresence: Failed to initialize presence tracking due to security restrictions:', error);
        // Graceful degradation - presence features will not be available
        setOnlineUsers(new Set());
        setPresenceState({});
      }
    };

    initializePresence();

    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user, updatePresenceState]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  const getUserPresence = useCallback((userId: string) => {
    return presenceState[userId];
  }, [presenceState]);

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    getUserPresence,
    totalOnlineUsers: onlineUsers.size,
  };
};