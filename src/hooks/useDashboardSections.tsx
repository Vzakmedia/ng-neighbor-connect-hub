import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { playNotification } from '@/utils/audioUtils';

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: string;
  created_at: string;
}

interface SafetyAlert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  time: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

interface MarketplaceItem {
  id: string;
  title: string;
  price: string;
  location: string;
  image?: string;
  category: string;
  created_at: string;
}

interface TrendingTopic {
  tag: string;
  posts: number;
}

import { useQuery } from '@tanstack/react-query';

export const useUpcomingEvents = (limit: number = 3) => {
  const { user } = useAuth();
  const { profile } = useProfile();

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['community-highlights', 'events', limit, profile?.city],
    queryFn: async () => {
      if (!user || !profile) return [];

      // Get user's creation date for clean slate filtering
      const { data: userData } = await supabase.auth.getUser();
      const userCreatedAt = userData.user?.created_at;

      const now = new Date().toISOString();

      let query = supabase
        .from('community_posts')
        .select(`
          id,
          title,
          content,
          location,
          created_at,
          profiles!community_posts_user_id_fkey (
            full_name,
            neighborhood,
            city,
            state
          )
        `)
        .eq('post_type', 'event')
        .gte('created_at', now)
        .order('created_at', { ascending: true })
        .limit(limit);

      // Only show events created after user joined (clean slate)
      if (userCreatedAt) {
        query = query.gte('created_at', userCreatedAt);
      }

      // Filter by location: neighborhood > city > state
      if (profile.neighborhood) {
        query = query.eq('profiles.neighborhood', profile.neighborhood);
      } else if (profile.city) {
        query = query.eq('profiles.city', profile.city);
      } else if (profile.state) {
        query = query.eq('profiles.state', profile.state);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get RSVP counts for each event
      const eventIds = (data || []).map(event => event.id);
      const { data: rsvpData } = eventIds.length > 0
        ? await supabase
          .from('event_rsvps')
          .select('post_id')
          .in('post_id', eventIds)
          .eq('status', 'attending')
        : { data: [] };

      const rsvpCounts = (rsvpData || []).reduce((acc, rsvp) => {
        acc[rsvp.post_id] = (acc[rsvp.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (data || []).map((event) => {
        const eventDate = event.event_date ? new Date(event.event_date) : new Date(event.created_at);

        return {
          id: event.id,
          title: event.title || 'Community Event',
          date: eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          }),
          time: eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          location: event.location || (event.profiles as any)?.neighborhood || (event.profiles as any)?.city || 'TBA',
          attendees: rsvpCounts[event.id] || 0,
          type: 'community',
          created_at: event.created_at
        };
      });
    },
    enabled: !!user && !!profile,
  });

  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'community_posts',
          filter: 'post_type=eq.event'
        }, () => {
          refetch();
        }),
      {
        channelName: 'upcoming_events_changes',
        onError: () => refetch(),
        pollInterval: 180000, // 3 minutes
        debugName: 'UpcomingEvents'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, limit, refetch]);

  return { events, loading: isLoading, refetch };
};

export const useSafetyAlerts = (limit: number = 3) => {
  const { user } = useAuth();
  const alertCountRef = useRef(0);

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['safety-alerts', limit],
    queryFn: async () => {
      if (!user) return [];

      // Get user's creation date for clean slate filtering
      const { data: userData } = await supabase.auth.getUser();
      const userCreatedAt = userData.user?.created_at;

      let query = supabase
        .from('safety_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Only show alerts created after user joined (clean slate)
      if (userCreatedAt) {
        query = query.gte('created_at', userCreatedAt);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedAlerts: SafetyAlert[] = (data || []).map(alert => {
        const createdDate = new Date(alert.created_at);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

        let timeAgo = '';
        if (diffInHours < 1) {
          timeAgo = 'Just now';
        } else if (diffInHours < 24) {
          timeAgo = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else {
          const diffInDays = Math.floor(diffInHours / 24);
          timeAgo = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        }

        return {
          id: alert.id,
          type: alert.alert_type === 'fire' ? 'danger' : alert.alert_type === 'accident' ? 'warning' : 'info',
          title: alert.title,
          description: alert.description,
          time: timeAgo,
          severity: alert.severity,
          created_at: alert.created_at
        };
      });

      // Play notification sound if new alerts arrived
      if (formattedAlerts.length > alertCountRef.current && alertCountRef.current > 0) {
        try {
          const { playNotification } = await import('@/utils/audioUtils');
          playNotification('emergency');
        } catch (error) {
          console.error('Error playing safety alert notification sound:', error);
        }
      }

      alertCountRef.current = formattedAlerts.length;
      return formattedAlerts;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'safety_alerts'
        }, () => {
          refetch();
        }),
      {
        channelName: 'safety_alerts_changes',
        onError: () => refetch(),
        pollInterval: 10000, // Poll every 10 seconds for safety alerts
        debugName: 'SafetyAlerts'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, limit, refetch]);

  return { alerts, loading: isLoading, refetch };
};

export const useMarketplaceHighlights = (limit: number = 3) => {
  const { user } = useAuth();
  const { profile } = useProfile();

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['marketplace', 'highlights', limit, profile?.city],
    queryFn: async () => {
      if (!user || !profile) return [];

      // Get user's creation date for clean slate filtering
      const { data: userData } = await supabase.auth.getUser();
      const userCreatedAt = userData.user?.created_at;

      let query = supabase
        .from('marketplace_items')
        .select(`
          id,
          title,
          price,
          category,
          images,
          created_at,
          profiles!marketplace_items_user_id_fkey (
            neighborhood,
            city,
            state
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Only show items created after user joined (clean slate)
      if (userCreatedAt) {
        query = query.gte('created_at', userCreatedAt);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        price: `₦${item.price?.toLocaleString()}`,
        location: (item.profiles as any)?.neighborhood || (item.profiles as any)?.city || (item.profiles as any)?.state || 'Location not specified',
        image: item.images && item.images.length > 0 ? item.images[0] : '/placeholder.svg',
        category: item.category,
        created_at: item.created_at
      }));
    },
    enabled: !!user && !!profile,
  });

  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'marketplace_items'
        }, () => {
          refetch();
        }),
      {
        channelName: 'marketplace_highlights_changes',
        onError: () => refetch(),
        pollInterval: 300000, // 5 minutes
        debugName: 'MarketplaceHighlights'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, limit, refetch]);

  return { items, loading: isLoading, refetch };
};

export const useTrendingTopics = (limit: number = 4) => {
  const { user } = useAuth();

  const { data: topics = [], isLoading, refetch } = useQuery({
    queryKey: ['community-highlights', 'trending', limit],
    queryFn: async () => {
      if (!user) return [];

      // Get user's creation date for clean slate filtering
      const { data: userData } = await supabase.auth.getUser();
      const userCreatedAt = userData.user?.created_at;

      // Get all tags from recent posts (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Use the more recent date between user creation and 7 days ago
      const filterDate = userCreatedAt && new Date(userCreatedAt) > sevenDaysAgo
        ? userCreatedAt
        : sevenDaysAgo.toISOString();

      const { data, error } = await supabase
        .from('community_posts')
        .select('tags')
        .gte('created_at', filterDate)
        .not('tags', 'is', null);

      if (error) throw error;

      // Count tag occurrences
      const tagCounts: Record<string, number> = {};

      (data || []).forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          });
        }
      });

      return Object.entries(tagCounts)
        .map(([tag, posts]) => ({ tag, posts }))
        .sort((a, b) => b.posts - a.posts)
        .slice(0, limit);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'community_posts'
        }, () => {
          refetch();
        }),
      {
        channelName: 'trending_topics_changes',
        onError: () => refetch(),
        pollInterval: 600000, // 10 minutes
        debugName: 'TrendingTopics'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, limit, refetch]);

  return { topics, loading: isLoading, refetch };
};