import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';

interface DashboardStats {
  activeNeighbors: number;
  postsToday: number;
  upcomingEvents: number;
  itemsForSale: number;
  loading: boolean;
}

export const useDashboardStats = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [stats, setStats] = useState<DashboardStats>({
    activeNeighbors: 0,
    postsToday: 0,
    upcomingEvents: 0,
    itemsForSale: 0,
    loading: true,
  });

  const fetchStats = async () => {
    if (!user || !profile) return;

    try {
      // Get active neighbors (users who posted in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeNeighborsData } = await supabase
        .from('community_posts')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .neq('user_id', user.id);

      const uniqueNeighbors = new Set(activeNeighborsData?.map(post => post.user_id) || []);

      // Get posts today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: postsToday } = await supabase
        .from('community_posts')
        .select('id', { count: 'exact' })
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      // Get upcoming events (next 30 days)
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);

      const { data: upcomingEvents } = await supabase
        .from('community_posts')
        .select('id', { count: 'exact' })
        .eq('post_type', 'event')
        .gte('created_at', new Date().toISOString())
        .lte('created_at', nextMonth.toISOString());

      // Get active marketplace items
      const { data: itemsForSale } = await supabase
        .from('marketplace_items')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      setStats({
        activeNeighbors: uniqueNeighbors.size,
        postsToday: postsToday?.length || 0,
        upcomingEvents: upcomingEvents?.length || 0,
        itemsForSale: itemsForSale?.length || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id, profile?.user_id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'community_posts'
        }, () => {
          fetchStats();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'marketplace_items'
        }, () => {
          fetchStats();
        }),
      {
        channelName: 'dashboard_stats_changes',
        onError: fetchStats,
        pollInterval: 60000, // Poll every minute for stats
        debugName: 'DashboardStats'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user]);

  return stats;
};