import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

    setPresenceState(flattened);
    setOnlineUsers(userIds);
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online_users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presences = channel.presenceState() as UserPresence;
        updatePresenceState(presences);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;

        // Get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        // Track current user presence
        const presenceTrackStatus = await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          user_name: profile?.full_name || 'Anonymous',
          avatar_url: profile?.avatar_url || null,
        });

        console.log('Presence track status:', presenceTrackStatus);
      });

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
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