import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Recommendation } from '@/types/recommendations';

export function useFeedRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feed-recommendations', user?.id],
    queryFn: async () => {
      let query = supabase
        .from('recommendations')
        .select(`
          *,
          author:profiles!recommendations_user_id_fkey(user_id, full_name, avatar_url),
          is_saved:saved_recommendations!left(id),
          is_liked:recommendation_likes!left(id)
        `)
        .eq('status', 'approved')
        .order('average_rating', { ascending: false })
        .order('total_likes', { ascending: false })
        .limit(8);

      const { data, error } = await query;

      if (error) throw error;

      // Transform data
      const recommendations: Recommendation[] = (data || []).map(item => ({
        ...item,
        is_saved: user ? (item.is_saved as any[]).some((s: any) => s.user_id === user.id) : false,
        is_liked: user ? (item.is_liked as any[]).some((l: any) => l.user_id === user.id) : false,
      }));

      return recommendations;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}
