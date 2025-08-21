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
  const [fallbackMode, setFallbackMode] = useState(false);

  const updatePresenceState = useCallback((presences: UserPresence) => {
    const flattened: PresenceState = {};
    const userIds = new Set<string>();

    Object.entries(presences).forEach(([key, presence]) => {
      if (presence && presence.length > 0) {
        const latestPresence = presence[0]; // Get the most recent presence
        if (latestPresence.user_id) {
          flattened[latestPresence.user_id] = latestPresence;
          userIds.add(latestPresence.user_id);
        }
      }
    });

    console.log('Real-time presence update:', { 
      totalOnline: userIds.size, 
      userIds: Array.from(userIds), 
      presenceData: flattened 
    });
    setPresenceState(flattened);
    setOnlineUsers(userIds);
  }, []);

  // Fallback: assume current user and recently active users are online
  const fallbackPresenceCheck = useCallback(async () => {
    if (!user) return;
    
    try {
      // Always mark current user as online
      const activeUsers = new Set<string>([user.id]);
      
      // Get recently active users (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Check for recent activity in various tables
      const [messagesData, postsData, profilesData] = await Promise.all([
        supabase
          .from('direct_messages')
          .select('sender_id')
          .gte('created_at', fiveMinutesAgo)
          .limit(20),
        supabase
          .from('community_posts')
          .select('user_id')
          .gte('created_at', fiveMinutesAgo)
          .limit(20),
        supabase
          .from('profiles')
          .select('user_id, updated_at')
          .gte('updated_at', fiveMinutesAgo)
          .limit(20),
      ]);

      // Add recently active users
      messagesData.data?.forEach(msg => activeUsers.add(msg.sender_id));
      postsData.data?.forEach(post => activeUsers.add(post.user_id));
      profilesData.data?.forEach(profile => activeUsers.add(profile.user_id));

      console.log('Fallback presence check - active users:', Array.from(activeUsers));
      setOnlineUsers(activeUsers);
      
      // Create basic presence state for active users
      const basicPresenceState: PresenceState = {};
      activeUsers.forEach(userId => {
        basicPresenceState[userId] = {
          user_id: userId,
          online_at: new Date().toISOString(),
        };
      });
      setPresenceState(basicPresenceState);
      
    } catch (error) {
      console.error('Error in fallback presence check:', error);
      // At minimum, mark current user as online
      setOnlineUsers(new Set([user.id]));
      setPresenceState({
        [user.id]: {
          user_id: user.id,
          online_at: new Date().toISOString(),
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let subscription: any = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

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
                  setFallbackMode(false);
                } catch (error) {
                  console.error('Error syncing presence:', error);
                  setFallbackMode(true);
                }
              })
              .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('User joined:', key, newPresences);
                const presences = channel.presenceState() as UserPresence;
                updatePresenceState(presences);
              })
              .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('User left:', key, leftPresences);
                const presences = channel.presenceState() as UserPresence;
                updatePresenceState(presences);
              })
              .subscribe(async (status) => {
                console.log('Presence subscription status:', status);
                
                if (status === 'TIMED_OUT' || status === 'CLOSED') {
                  console.log('Presence connection failed, switching to fallback mode');
                  setFallbackMode(true);
                  return;
                }
                
                if (status !== 'SUBSCRIBED') return;

                try {
                  const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('user_id', user.id)
                    .maybeSingle();

                  if (profileError) {
                    console.error('Error fetching profile:', profileError);
                  }

                  const presenceData = {
                    user_id: user.id,
                    online_at: new Date().toISOString(),
                    user_name: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
                    avatar_url: profile?.avatar_url || null,
                  };

                  const presenceTrackStatus = await channel.track(presenceData);
                  console.log('Tracking user presence:', presenceData, presenceTrackStatus);
                  
                  const currentPresences = channel.presenceState() as UserPresence;
                  console.log('Current online users:', currentPresences);
                  updatePresenceState(currentPresences);
                  setFallbackMode(false);
                } catch (error) {
                  console.error('Error tracking presence:', error);
                  setFallbackMode(true);
                }
              });
          },
          {
            channelName: 'global_user_presence',
            debugName: 'UserPresence',
            pollInterval: 30000,
            onError: () => {
              console.log('UserPresence: Connection issues, switching to fallback mode');
              setFallbackMode(true);
            },
          }
        );

        // Set up fallback interval
        fallbackInterval = setInterval(() => {
          if (fallbackMode) {
            fallbackPresenceCheck();
          }
        }, 10000); // Check every 10 seconds in fallback mode

        // Initial fallback check
        setTimeout(() => {
          if (fallbackMode || !subscription) {
            fallbackPresenceCheck();
          }
        }, 2000);

      } catch (error) {
        console.error('UserPresence: Failed to initialize presence tracking:', error);
        setFallbackMode(true);
        fallbackPresenceCheck();
      }
    };

    initializePresence();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [user, updatePresenceState, fallbackMode, fallbackPresenceCheck]);

  const isUserOnline = useCallback((userId: string) => {
    // In fallback mode, be more lenient about marking users as online
    if (fallbackMode && userId === user?.id) {
      return true; // Current user is always online
    }
    return onlineUsers.has(userId);
  }, [onlineUsers, fallbackMode, user?.id]);

  const getUserPresence = useCallback((userId: string) => {
    return presenceState[userId];
  }, [presenceState]);

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    getUserPresence,
    totalOnlineUsers: onlineUsers.size,
    fallbackMode, // Expose fallback mode for debugging
  };
};