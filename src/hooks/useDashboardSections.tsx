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

export const useUpcomingEvents = (limit: number = 3) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    if (!user || !profile) return;

    try {
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
          event_date,
          profiles!community_posts_user_id_fkey (
            full_name,
            neighborhood,
            city,
            state
          )
        `)
        .eq('post_type', 'event')
        .gte('event_date', now)
        .order('event_date', { ascending: true })
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

      const formattedEvents: UpcomingEvent[] = (data || []).map((event) => {
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

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user?.id, profile?.user_id, limit]);

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
          fetchEvents();
        }),
      {
        channelName: 'upcoming_events_changes',
        onError: fetchEvents,
        pollInterval: 180000, // 3 minutes
        debugName: 'UpcomingEvents'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, limit]);

  return { events, loading, refetch: fetchEvents };
};

export const useSafetyAlerts = (limit: number = 3) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const alertCountRef = useRef(0);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
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
          // Get audio settings from native storage
          const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
          const { getItem } = useNativeStorage();
          const audioSettingsRaw = await getItem('audioSettings');
          const audioSettings = audioSettingsRaw ? JSON.parse(audioSettingsRaw) : {};
          const soundEnabled = audioSettings.soundEnabled !== false; // Default to true
          const volume = audioSettings.emergencyVolume?.[0] || 0.7;
          
          if (soundEnabled) {
            // Use emergency sound for safety alerts
            playNotification('emergency');
          }
        } catch (error) {
          console.error('Error playing safety alert notification sound:', error);
        }
      }
      
      alertCountRef.current = formattedAlerts.length;
      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Error fetching safety alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user?.id, limit]);

  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'safety_alerts'
        }, () => {
          fetchAlerts();
        }),
      {
        channelName: 'safety_alerts_changes',
        onError: fetchAlerts,
        pollInterval: 10000, // Poll every 10 seconds for safety alerts
        debugName: 'SafetyAlerts'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, limit]);

  return { alerts, loading, refetch: fetchAlerts };
};

export const useMarketplaceHighlights = (limit: number = 3) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!user || !profile) return;

    try {
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

      const formattedItems: MarketplaceItem[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        price: `₦${item.price?.toLocaleString()}`,
        location: (item.profiles as any)?.neighborhood || (item.profiles as any)?.city || (item.profiles as any)?.state || 'Location not specified',
        image: item.images && item.images.length > 0 ? item.images[0] : '/placeholder.svg',
        category: item.category,
        created_at: item.created_at
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user?.id, profile?.user_id, limit]);

  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'marketplace_items'
        }, () => {
          fetchItems();
        }),
      {
        channelName: 'marketplace_highlights_changes',
        onError: fetchItems,
        pollInterval: 300000, // 5 minutes
        debugName: 'MarketplaceHighlights'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, limit]);

  return { items, loading, refetch: fetchItems };
};

export const useTrendingTopics = (limit: number = 4) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrendingTopics = async () => {
    if (!user) return;

    try {
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

      // Convert to array and sort by count
      const sortedTopics = Object.entries(tagCounts)
        .map(([tag, posts]) => ({ tag, posts }))
        .sort((a, b) => b.posts - a.posts)
        .slice(0, limit);

      setTopics(sortedTopics);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTopics();
  }, [user?.id, limit]);

  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'community_posts'
        }, () => {
          fetchTrendingTopics();
        }),
      {
        channelName: 'trending_topics_changes',
        onError: fetchTrendingTopics,
        pollInterval: 600000, // 10 minutes
        debugName: 'TrendingTopics'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, limit]);

  return { topics, loading, refetch: fetchTrendingTopics };
};