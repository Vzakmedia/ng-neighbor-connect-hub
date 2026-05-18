import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Recommendation } from '@/types/recommendations';

export function useFeedRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feed-recommendations-items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          author:profiles!recommendations_user_id_fkey(user_id, full_name, avatar_url)
        `)
        .eq('status', 'approved')
        .order('average_rating', { ascending: false })
        .order('total_likes', { ascending: false })
        .limit(8);

      if (error) throw error;

      let savedIds = new Set<string>();
      let likedIds = new Set<string>();

      if (user && data && data.length > 0) {
        const ids = data.map((r: any) => r.id);
        const [savedRes, likedRes] = await Promise.all([
          supabase
            .from('saved_recommendations')
            .select('recommendation_id')
            .eq('user_id', user.id)
            .in('recommendation_id', ids),
          supabase
            .from('recommendation_likes')
            .select('recommendation_id')
            .eq('user_id', user.id)
            .in('recommendation_id', ids),
        ]);
        savedIds = new Set((savedRes.data || []).map((s: any) => s.recommendation_id));
        likedIds = new Set((likedRes.data || []).map((l: any) => l.recommendation_id));
      }

      // Transform data
      const recommendations: Recommendation[] = (data || []).map(item => ({
        ...item,
        is_saved: savedIds.has(item.id),
        is_liked: likedIds.has(item.id),
      }));

      return recommendations;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}
