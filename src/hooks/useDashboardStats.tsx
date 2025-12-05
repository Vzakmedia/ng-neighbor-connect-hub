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
      // Get date boundaries
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);

      // Run all queries in parallel for efficiency
      const [activeNeighborsData, postsTodayResult, upcomingEventsResult, itemsForSaleResult] = await Promise.all([
        // Get active neighbors (users who posted in the last 30 days) - limit to reduce data transfer
        supabase
          .from('community_posts')
          .select('user_id')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .neq('user_id', user.id)
          .limit(1000),
        
        // Get posts today count using head:true (much faster - no data returned)
        supabase
          .from('community_posts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        
        // Get upcoming events count
        supabase
          .from('community_posts')
          .select('*', { count: 'exact', head: true })
          .eq('post_type', 'event')
          .gte('created_at', new Date().toISOString())
          .lte('created_at', nextMonth.toISOString()),
        
        // Get active marketplace items count
        supabase
          .from('marketplace_items')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
      ]);

      const uniqueNeighbors = new Set(activeNeighborsData.data?.map(post => post.user_id) || []);

      setStats({
        activeNeighbors: uniqueNeighbors.size,
        postsToday: postsTodayResult.count || 0,
        upcomingEvents: upcomingEventsResult.count || 0,
        itemsForSale: itemsForSaleResult.count || 0,
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