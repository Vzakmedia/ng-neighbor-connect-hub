import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { createSafeSubscription, getConnectionDiagnostics } from '@/utils/realtimeUtils';

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
    last_ping?: number;
  };
}

export const useUserPresence = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [fallbackMode, setFallbackMode] = useState(false);
  
  // Recovery mechanism state
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<number | null>(null);
  
  // Smart polling state - track page visibility and route
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const [userIsActive, setUserIsActive] = useState(true);
  
  // Only run presence on messaging pages
  const isMessagingRoute = location.pathname === '/messages' || location.pathname.startsWith('/chat');
  
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

    // Delta update - only log changes
    setPresenceState(prev => {
      const joined = Array.from(userIds).filter(id => !prev[id]);
      const left = Object.keys(prev).filter(id => !userIds.has(id));
      
      if (joined.length > 0 || left.length > 0) {
        console.log('Presence delta:', { joined, left, totalOnline: userIds.size });
      }
      
      return flattened;
    });
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

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Track user activity for smart polling
  useEffect(() => {
    const handleActivity = () => setUserIsActive(true);
    const events = ['mousemove', 'keypress', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    const inactivityTimer = setInterval(() => {
      setUserIsActive(false);
    }, 120000); // Mark as inactive after 2 minutes
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(inactivityTimer);
    };
  }, []);

  useEffect(() => {
    if (!user || !isMessagingRoute) {
      // Don't initialize presence tracking if not on messaging pages
      return;
    }

    let subscription: any = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let keepAliveInterval: NodeJS.Timeout | null = null;

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

        // Keep-alive ping every 30 seconds when page is visible and connected
        keepAliveInterval = setInterval(() => {
          if (subscription && isPageVisible && !fallbackMode && userIsActive) {
            const channel = subscription;
            const currentPresence = channel.presenceState() as UserPresence;
            const userPresence = currentPresence[user.id]?.[0];
            
            if (userPresence) {
              channel.track({
                ...userPresence,
                last_ping: Date.now()
              }).catch((error: any) => {
                console.error('Keep-alive ping failed:', error);
              });
            }
          }
        }, 30000);

        // Smart polling - increased interval to 180 seconds (3 minutes)
        // Only poll when page is visible, user is active, and in fallback mode
        fallbackInterval = setInterval(() => {
          if (fallbackMode && userIsActive && isPageVisible) {
            fallbackPresenceCheck();
          }
        }, 180000); // Check every 3 minutes

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
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };
  }, [user, isMessagingRoute, updatePresenceState, fallbackPresenceCheck, userIsActive, isPageVisible, attemptReconnection, retryAttempt, connectionMetrics.isIOS, fallbackMode]);

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

  const getConnectionStatus = useCallback(() => {
    const diagnostics = getConnectionDiagnostics();
    const recentDiagnostics = diagnostics.slice(-10);
    
    return {
      fallbackMode,
      connectionMetrics,
      retryAttempt,
      lastSuccessfulConnection: lastSuccessfulConnection 
        ? new Date(lastSuccessfulConnection).toISOString() 
        : null,
      recentDiagnostics: recentDiagnostics.map(d => ({
        ...d,
        timestamp: new Date(d.timestamp).toISOString()
      }))
    };
  }, [fallbackMode, connectionMetrics, retryAttempt, lastSuccessfulConnection]);

  const manualRefresh = useCallback(() => {
    if (isMessagingRoute) {
      fallbackPresenceCheck();
    }
  }, [isMessagingRoute, fallbackPresenceCheck]);

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    getUserPresence,
    totalOnlineUsers: onlineUsers.size,
    fallbackMode,
    connectionStatus: getConnectionStatus(), // Detailed diagnostics
    manualRefresh, // Allow manual refresh on messages page
    isEnabled: isMessagingRoute, // Expose whether presence is enabled
  };
};