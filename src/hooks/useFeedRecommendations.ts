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
        .select('*')
        .eq('status', 'approved')
        .order('average_rating', { ascending: false })
        .order('total_likes', { ascending: false })
        .limit(8);

      if (error) throw error;

      const rows = data || [];
      if (rows.length === 0) return [];

      const userIds = [...new Set(rows.map((r: any) => r.user_id).filter(Boolean))];

      const [profilesRes, savedRes, likedRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds),
        user
          ? supabase
              .from('saved_recommendations')
              .select('recommendation_id')
              .eq('user_id', user.id)
              .in('recommendation_id', rows.map((r: any) => r.id))
          : Promise.resolve({ data: [] }),
        user
          ? supabase
              .from('recommendation_likes')
              .select('recommendation_id')
              .eq('user_id', user.id)
              .in('recommendation_id', rows.map((r: any) => r.id))
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map(
        (profilesRes.data || []).map((p: any) => [p.user_id, p])
      );
      const savedIds = new Set((savedRes.data || []).map((s: any) => s.recommendation_id));
      const likedIds = new Set((likedRes.data || []).map((l: any) => l.recommendation_id));

      const recommendations: Recommendation[] = rows.map((item: any) => ({
        ...item,
        author: profileMap.get(item.user_id) ?? null,
        is_saved: savedIds.has(item.id),
        is_liked: likedIds.has(item.id),
      }));

      return recommendations;
    },
    staleTime: 1000 * 60 * 10,
  });
}
