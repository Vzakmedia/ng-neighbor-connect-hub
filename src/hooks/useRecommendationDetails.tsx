import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Recommendation, RecommendationReview, RecommendationTip } from '@/types/recommendations';

export function useRecommendationDetails(recommendationId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendation', recommendationId],
    queryFn: async () => {
      if (!recommendationId) throw new Error('No ID provided');

      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          author:profiles!recommendations_user_id_fkey(user_id, full_name, avatar_url)
        `)
        .eq('id', recommendationId)
        .single();

      if (error) throw error;

      let is_saved = false;
      let is_liked = false;

      if (user) {
        const [savedRow, likedRow] = await Promise.all([
          supabase
            .from('saved_recommendations')
            .select('id')
            .eq('recommendation_id', recommendationId)
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('recommendation_likes')
            .select('id')
            .eq('recommendation_id', recommendationId)
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);
        is_saved = !!savedRow.data;
        is_liked = !!likedRow.data;
      }

      const recommendation: Recommendation = {
        ...data,
        is_saved,
        is_liked,
      };

      return recommendation;
    },
    enabled: !!recommendationId,
  });
}

export function useRecommendationReviews(recommendationId: string | undefined, sortBy: 'recent' | 'helpful' | 'rating_high' | 'rating_low' = 'helpful') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendation-reviews', recommendationId, sortBy],
    queryFn: async () => {
      if (!recommendationId) throw new Error('No ID provided');

      let query = supabase
        .from('recommendation_reviews')
        .select(`
          *,
          reviewer:profiles!recommendation_reviews_reviewer_id_fkey(user_id, full_name, avatar_url),
          user_reaction:review_reactions!left(reaction_type)
        `)
        .eq('recommendation_id', recommendationId)
        .eq('is_flagged', false);

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'helpful') {
        query = query.order('helpful_count', { ascending: false });
      } else if (sortBy === 'rating_high') {
        query = query.order('rating', { ascending: false });
      } else if (sortBy === 'rating_low') {
        query = query.order('rating', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      const reviews: RecommendationReview[] = (data || []).map(review => ({
        ...review,
        user_reaction: user ? (review.user_reaction as any[]).find((r: any) => r.user_id === user.id)?.reaction_type || null : null,
      }));

      return reviews;
    },
    enabled: !!recommendationId,
  });
}

export function useRecommendationTips(recommendationId: string | undefined) {
  return useQuery({
    queryKey: ['recommendation-tips', recommendationId],
    queryFn: async () => {
      if (!recommendationId) throw new Error('No ID provided');

      const { data, error } = await supabase
        .from('recommendation_tips')
        .select(`
          *,
          author:profiles!recommendation_tips_user_id_fkey(user_id, full_name, avatar_url)
        `)
        .eq('recommendation_id', recommendationId)
        .order('helpful_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data as RecommendationTip[];
    },
    enabled: !!recommendationId,
  });
}

export function useSimilarRecommendations(recommendation: Recommendation | undefined) {
  return useQuery({
    queryKey: ['similar-recommendations', recommendation?.id, recommendation?.category],
    queryFn: async () => {
      if (!recommendation) throw new Error('No recommendation provided');

      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('status', 'approved')
        .eq('category', recommendation.category)
        .eq('city', recommendation.city)
        .neq('id', recommendation.id)
        .order('average_rating', { ascending: false })
        .limit(6);

      if (error) throw error;

      return data as Recommendation[];
    },
    enabled: !!recommendation,
  });
}
