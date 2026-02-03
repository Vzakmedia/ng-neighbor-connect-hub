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

import { useQuery } from '@tanstack/react-query';

export const useDashboardStats = () => {
  const { user } = useAuth();
  const { profile } = useProfile();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats', profile?.user_id],
    queryFn: async () => {
      if (!user || !profile) return null;

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

      return {
        activeNeighbors: uniqueNeighbors.size,
        postsToday: postsTodayResult.count || 0,
        upcomingEvents: upcomingEventsResult.count || 0,
        itemsForSale: itemsForSaleResult.count || 0,
      };
    },
    enabled: !!user && !!profile,
  });

  // Set up real-time subscriptions to trigger refetch
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
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'marketplace_items'
        }, () => {
          refetch();
        }),
      {
        channelName: 'dashboard_stats_changes',
        onError: () => refetch(),
        pollInterval: 60000, // Poll every minute for stats
        debugName: 'DashboardStats'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, refetch]);

  return {
    ...stats,
    loading: isLoading,
  };
};