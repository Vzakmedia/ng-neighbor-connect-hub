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
      const { data, error } = await supabase
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
            city
          )
        `)
        .eq('post_type', 'event')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedEvents: UpcomingEvent[] = (data || []).map((event, index) => ({
        id: event.id,
        title: event.title || 'Community Event',
        date: new Date(event.created_at).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: new Date(event.created_at).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        location: event.location || (event.profiles as any)?.neighborhood || (event.profiles as any)?.city || 'TBA',
        attendees: Math.floor(Math.random() * 50) + 10, // Placeholder until RSVP system
        type: ['community', 'social', 'sports', 'education'][index % 4],
        created_at: event.created_at
      }));

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
      const { data, error } = await supabase
        .from('safety_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

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
          // Get audio settings from localStorage
          const audioSettings = JSON.parse(localStorage.getItem('audioSettings') || '{}');
          const soundEnabled = audioSettings.soundEnabled !== false; // Default to true
          const volume = audioSettings.emergencyVolume?.[0] || 0.7;
          
          if (soundEnabled) {
            // Use emergency sound for safety alerts
            playNotification('emergency', volume);
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
        pollInterval: 120000, // 2 minutes
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
      const { data, error } = await supabase
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
      // Get all tags from recent posts (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('community_posts')
        .select('tags')
        .gte('created_at', sevenDaysAgo.toISOString())
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

      // Add fallback topics if not enough trending
      const fallbackTopics = [
        { tag: '#CommunityLife', posts: 5 },
        { tag: '#LocalBusiness', posts: 3 },
        { tag: '#NeighborhoodWatch', posts: 2 },
        { tag: '#EventPlanning', posts: 1 }
      ];

      const finalTopics = sortedTopics.length >= limit 
        ? sortedTopics 
        : [...sortedTopics, ...fallbackTopics.slice(0, limit - sortedTopics.length)];

      setTopics(finalTopics);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      // Set fallback topics on error
      setTopics([
        { tag: '#CommunityLife', posts: 5 },
        { tag: '#LocalBusiness', posts: 3 },
        { tag: '#NeighborhoodWatch', posts: 2 },
        { tag: '#EventPlanning', posts: 1 }
      ]);
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