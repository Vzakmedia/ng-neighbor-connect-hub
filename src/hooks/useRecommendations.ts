import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RecommendationWeights {
  tag_match: number;
  location_match: number;
  recency_boost: number;
  engagement_quality: number;
}

interface UserPreferences {
  preferredTags: string[];
  preferredLocations: string[];
  engagementScore: number;
}

interface RecommendationData {
  weights: RecommendationWeights;
  userPreferences: UserPreferences;
}

export function useRecommendations() {
  const { user } = useAuth();

  return useQuery<RecommendationData>({
    queryKey: ['personalized-feed-weights', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('generate-feed-recommendations', {
        body: { userId: user.id }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
  });
}

/**
 * Calculate a personalized score for a post based on AI-generated weights
 */
export function calculatePostScore(
  post: any,
  recommendations: RecommendationData | undefined
): number {
  if (!recommendations) return 0;

  const { weights, userPreferences } = recommendations;
  let score = 0;

  // Tag matching score
  const postTags = post.tags || [];
  const tagMatches = postTags.filter((tag: string) =>
    userPreferences.preferredTags.includes(tag)
  ).length;
  const tagScore = tagMatches / Math.max(userPreferences.preferredTags.length, 1);
  score += tagScore * weights.tag_match;

  // Location matching score
  const locationMatch = userPreferences.preferredLocations.includes(post.location);
  score += (locationMatch ? 1 : 0) * weights.location_match;

  // Recency score (exponential decay over 7 days)
  const hoursSincePosted = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.exp(-hoursSincePosted / (24 * 7)); // Decay over 7 days
  score += recencyScore * weights.recency_boost;

  // Engagement quality score
  const totalEngagement = (post.like_count || 0) + (post.comment_count || 0) * 2 + (post.save_count || 0) * 3;
  const engagementScore = Math.min(totalEngagement / 50, 1); // Normalize to 0-1
  score += engagementScore * weights.engagement_quality;

  return score;
}
