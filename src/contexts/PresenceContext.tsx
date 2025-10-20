import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  };
}

interface PresenceContextValue {
  onlineUsers: string[];
  isUserOnline: (userId: string) => boolean;
  getUserPresence: (userId: string) => PresenceState[string] | undefined;
  totalOnlineUsers: number;
  fallbackMode: boolean;
  connectionStatus: {
    fallbackMode: boolean;
    connectionMetrics: {
      isIOS: boolean;
      totalAttempts: number;
      failedConnections: number;
    };
    retryAttempt: number;
    lastSuccessfulConnection: string | null;
    recentDiagnostics: any[];
  };
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  
  // Use refs to prevent triggering re-initialization
  const fallbackModeRef = useRef(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const retryAttemptRef = useRef(0);
  const lastSuccessfulConnectionRef = useRef<number | null>(null);
  const userIsActiveRef = useRef(true);
  const hasLoggedFallbackRef = useRef(false);
  
  const connectionMetrics = useRef({
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    totalAttempts: 0,
    failedConnections: 0
  });

  // Debounced state update to prevent rapid changes
  const debouncedSetFallbackMode = useCallback((value: boolean) => {
    if (fallbackModeRef.current === value) return;
    fallbackModeRef.current = value;
    setFallbackMode(value);
    
    // Only log once when switching modes
    if (value && !hasLoggedFallbackRef.current) {
      console.info('Presence: Real-time unavailable, using polling fallback');
      hasLoggedFallbackRef.current = true;
    } else if (!value && hasLoggedFallbackRef.current) {
      console.info('Presence: Real-time connection restored');
      hasLoggedFallbackRef.current = false;
    }
  }, []);

  const updatePresenceState = useCallback((presences: UserPresence) => {
    const flattened: PresenceState = {};
    const userIds = new Set<string>();

    Object.entries(presences).forEach(([, presence]) => {
      if (presence && presence.length > 0) {
        const latestPresence = presence[0];
        if (latestPresence.user_id) {
          flattened[latestPresence.user_id] = latestPresence;
          userIds.add(latestPresence.user_id);
        }
      }
    });

    setPresenceState(flattened);
    setOnlineUsers(userIds);
  }, []);

  const fallbackPresenceCheck = useCallback(async () => {
    if (!user) return;
    
    try {
      const activeUsers = new Set<string>([user.id]);
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .rpc('get_recently_active_users', { 
          since_timestamp: twoMinutesAgo 
        });

      if (error) throw error;

      data?.forEach((item: { user_id: string }) => activeUsers.add(item.user_id));
      
      setOnlineUsers(activeUsers);
      
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

  // Track user activity for smart polling
  useEffect(() => {
    const handleActivity = () => { userIsActiveRef.current = true; };
    const events = ['mousemove', 'keypress', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    const inactivityTimer = setInterval(() => {
      userIsActiveRef.current = false;
    }, 60000);
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(inactivityTimer);
    };
  }, []);

  // Main presence subscription - only depends on user
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
                  updatePresenceState(presences);
                  
                  retryAttemptRef.current = 0;
                  lastSuccessfulConnectionRef.current = Date.now();
                  if (fallbackModeRef.current) {
                    debouncedSetFallbackMode(false);
                  }
                } catch (error) {
                  console.error('Error syncing presence:', error);
                  debouncedSetFallbackMode(true);
                }
              })
              .on('presence', { event: 'join' }, () => {
                const presences = channel.presenceState() as UserPresence;
                updatePresenceState(presences);
              })
              .on('presence', { event: 'leave' }, () => {
                const presences = channel.presenceState() as UserPresence;
                updatePresenceState(presences);
              })
              .subscribe(async (status) => {
                if (status === 'TIMED_OUT' || status === 'CLOSED') {
                  debouncedSetFallbackMode(true);
                  return;
                }
                
                if (status !== 'SUBSCRIBED') return;

                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('user_id', user.id)
                    .maybeSingle();

                  const presenceData = {
                    user_id: user.id,
                    online_at: new Date().toISOString(),
                    user_name: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
                    avatar_url: profile?.avatar_url || null,
                  };

                  await channel.track(presenceData);
                  
                  const currentPresences = channel.presenceState() as UserPresence;
                  updatePresenceState(currentPresences);
                  debouncedSetFallbackMode(false);
                  retryAttemptRef.current = 0;
                  lastSuccessfulConnectionRef.current = Date.now();
                } catch (error) {
                  console.error('Error tracking presence:', error);
                  debouncedSetFallbackMode(true);
                }
              });
          },
          {
            channelName: 'global_user_presence',
            debugName: 'UserPresence',
            pollInterval: 30000,
            onError: () => {
              debouncedSetFallbackMode(true);
            },
          }
        );

        // Smart polling - only when user is active
        fallbackInterval = setInterval(() => {
          if (fallbackModeRef.current && userIsActiveRef.current) {
            fallbackPresenceCheck();
          }
        }, 60000);

        // Initial fallback check
        setTimeout(() => {
          if (fallbackModeRef.current || !subscription) {
            fallbackPresenceCheck();
          }
        }, 2000);

      } catch (error) {
        console.error('Failed to initialize presence tracking:', error);
        debouncedSetFallbackMode(true);
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
  }, [user, updatePresenceState, fallbackPresenceCheck, debouncedSetFallbackMode]);

  const isUserOnline = useCallback((userId: string) => {
    if (fallbackModeRef.current && userId === user?.id) {
      return true;
    }
    return onlineUsers.has(userId);
  }, [onlineUsers, user?.id]);

  const getUserPresence = useCallback((userId: string) => {
    return presenceState[userId];
  }, [presenceState]);

  const getConnectionStatus = useCallback(() => {
    const diagnostics = getConnectionDiagnostics();
    const recentDiagnostics = diagnostics.slice(-10);
    
    return {
      fallbackMode: fallbackModeRef.current,
      connectionMetrics: connectionMetrics.current,
      retryAttempt: retryAttemptRef.current,
      lastSuccessfulConnection: lastSuccessfulConnectionRef.current 
        ? new Date(lastSuccessfulConnectionRef.current).toISOString() 
        : null,
      recentDiagnostics: recentDiagnostics.map(d => ({
        ...d,
        timestamp: new Date(d.timestamp).toISOString()
      }))
    };
  }, []);

  const value: PresenceContextValue = {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    getUserPresence,
    totalOnlineUsers: onlineUsers.size,
    fallbackMode,
    connectionStatus: getConnectionStatus(),
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return context;
};
