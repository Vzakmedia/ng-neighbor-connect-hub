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
  
  // Recovery mechanism state
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<number | null>(null);
  
  // Smart polling state
  const [userIsActive, setUserIsActive] = useState(true);
  
  // Connection diagnostics
  const [connectionMetrics] = useState({
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    totalAttempts: 0,
    failedConnections: 0
  });

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

  // Optimized fallback presence check using database function
  const fallbackPresenceCheck = useCallback(async () => {
    if (!user) return;
    
    try {
      const activeUsers = new Set<string>([user.id]);
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      // Single optimized query using custom database function
      const { data, error } = await supabase
        .rpc('get_recently_active_users', { 
          since_timestamp: twoMinutesAgo 
        });

      if (error) throw error;

      data?.forEach((item: { user_id: string }) => activeUsers.add(item.user_id));

      if (process.env.NODE_ENV === 'development') {
        console.debug('Fallback presence check - active users:', Array.from(activeUsers));
      }
      
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
      setOnlineUsers(new Set([user.id]));
      setPresenceState({
        [user.id]: {
          user_id: user.id,
          online_at: new Date().toISOString(),
        }
      });
    }
  }, [user]);
  
  // Recovery mechanism with exponential backoff
  const getRetryDelay = useCallback((attempt: number) => {
    return Math.min(30000 * Math.pow(2, attempt), 300000); // 30s to 5min
  }, []);
  
  const attemptReconnection = useCallback(() => {
    if (!fallbackMode || connectionMetrics.isIOS) return;
    
    const delay = getRetryDelay(retryAttempt);
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Scheduling Realtime reconnection attempt ${retryAttempt + 1} in ${delay / 1000}s`);
    }
    
    setTimeout(() => {
      setRetryAttempt(prev => prev + 1);
      setFallbackMode(false); // Trigger re-initialization
    }, delay);
  }, [fallbackMode, retryAttempt, getRetryDelay, connectionMetrics.isIOS]);

  // Track user activity for smart polling
  useEffect(() => {
    const handleActivity = () => setUserIsActive(true);
    const events = ['mousemove', 'keypress', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    const inactivityTimer = setInterval(() => {
      setUserIsActive(false);
    }, 60000); // Mark as inactive after 1 minute
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(inactivityTimer);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let subscription: any = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const initializePresence = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Initializing presence...', { 
            isIOS: connectionMetrics.isIOS, 
            retryAttempt 
          });
        }

        subscription = createSafeSubscription(
          (channel) => {
            return channel
              .on('presence', { event: 'sync' }, () => {
                try {
                  const presences = channel.presenceState() as UserPresence;
                  if (process.env.NODE_ENV === 'development') {
                    console.debug('Presence sync - raw presences:', presences);
                  }
                  updatePresenceState(presences);
                  
                  // Connection successful - reset retry attempts
                  setRetryAttempt(0);
                  setLastSuccessfulConnection(Date.now());
                  if (fallbackMode) {
                    setFallbackMode(false);
                    if (process.env.NODE_ENV === 'development') {
                      console.debug('Reconnected to Realtime successfully');
                    }
                  }
                } catch (error) {
                  console.error('Error syncing presence:', error);
                  setFallbackMode(true);
                }
              })
              .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                if (process.env.NODE_ENV === 'development') {
                  console.debug('User joined:', key, newPresences);
                }
                const presences = channel.presenceState() as UserPresence;
                updatePresenceState(presences);
              })
              .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                if (process.env.NODE_ENV === 'development') {
                  console.debug('User left:', key, leftPresences);
                }
                const presences = channel.presenceState() as UserPresence;
                updatePresenceState(presences);
              })
              .subscribe(async (status) => {
                if (process.env.NODE_ENV === 'development') {
                  console.debug('Presence subscription status:', status);
                }
                
                if (status === 'TIMED_OUT' || status === 'CLOSED') {
                  console.error('Presence connection failed, switching to fallback mode');
                  setFallbackMode(true);
                  
                  // Schedule reconnection attempt (unless iOS)
                  if (!connectionMetrics.isIOS) {
                    attemptReconnection();
                  }
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
                  if (process.env.NODE_ENV === 'development') {
                    console.debug('Tracking user presence:', presenceData, presenceTrackStatus);
                  }
                  
                  const currentPresences = channel.presenceState() as UserPresence;
                  updatePresenceState(currentPresences);
                  setFallbackMode(false);
                  setRetryAttempt(0);
                  setLastSuccessfulConnection(Date.now());
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
              console.error('UserPresence: Connection issues, switching to fallback mode');
              setFallbackMode(true);
              
              // Schedule reconnection attempt (unless iOS)
              if (!connectionMetrics.isIOS) {
                attemptReconnection();
              }
            },
          }
        );

        // Smart polling - only when user is active
        fallbackInterval = setInterval(() => {
          if (fallbackMode && userIsActive) {
            fallbackPresenceCheck();
          }
        }, 60000); // Check every 60 seconds

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
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [user, updatePresenceState, fallbackPresenceCheck, userIsActive, attemptReconnection, retryAttempt, connectionMetrics.isIOS]);

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