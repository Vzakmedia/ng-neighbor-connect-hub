import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';

export interface ModeratedRecommendation {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  user_id: string;
  average_rating: number | null;
  total_reviews: number | null;
  created_at: string;
  authorName: string | null;
}

export interface ModeratedReview {
  id: string;
  recommendation_id: string;
  reviewer_id: string;
  rating: number;
  review_title: string | null;
  review_text: string | null;
  is_flagged: boolean | null;
  created_at: string;
  reviewerName: string | null;
}

/**
 * Admin/moderator tooling for recommendations and their reviews.
 * recommendations has no FK to profiles — author names are fetched separately
 * and merged (PostgREST cannot embed without an FK).
 */
export const useRecommendationsModeration = () => {
  const { toast } = useToast();
  const { logContentModeration } = useAdminAuditLog();
  const [recommendations, setRecommendations] = useState<ModeratedRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = useCallback(async (filters?: { search?: string }) => {
    try {
      setLoading(true);

      let query = supabase
        .from('recommendations')
        .select('id, title, description, category, city, state, status, user_id, average_rating, total_reviews, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.search) {
        const term = filters.search.replace(/[%_,()]/g, '');
        if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as any[];
      const authorIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
      const namesById = new Map<string, string | null>();
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', authorIds);
        for (const p of profiles || []) namesById.set(p.user_id, p.full_name);
      }

      setRecommendations(rows.map((r) => ({ ...r, authorName: namesById.get(r.user_id) ?? null })));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({ title: 'Error', description: 'Failed to load recommendations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchReviews = useCallback(async (recommendationId: string): Promise<ModeratedReview[]> => {
    try {
      const { data, error } = await supabase
        .from('recommendation_reviews')
        .select('id, recommendation_id, reviewer_id, rating, review_title, review_text, is_flagged, created_at')
        .eq('recommendation_id', recommendationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as any[];
      const reviewerIds = [...new Set(rows.map((r) => r.reviewer_id).filter(Boolean))];
      const namesById = new Map<string, string | null>();
      if (reviewerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', reviewerIds);
        for (const p of profiles || []) namesById.set(p.user_id, p.full_name);
      }

      return rows.map((r) => ({ ...r, reviewerName: namesById.get(r.reviewer_id) ?? null }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({ title: 'Error', description: 'Failed to load reviews', variant: 'destructive' });
      return [];
    }
  }, [toast]);

  const deleteReview = useCallback(async (reviewId: string, reason?: string) => {
    try {
      const { data, error } = await supabase
        .from('recommendation_reviews')
        .delete()
        .eq('id', reviewId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows affected — check permissions');

      logContentModeration('admin_content_remove', reviewId, 'recommendation_review', reason);
      toast({ title: 'Review Deleted', description: 'The review has been removed' });
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({ title: 'Error', description: 'Failed to delete review', variant: 'destructive' });
      return false;
    }
  }, [toast, logContentModeration]);

  const deleteRecommendation = useCallback(async (recommendationId: string, reason?: string) => {
    try {
      // Cascade behavior is unverified for this table (created outside
      // migrations) — remove the reviews explicitly first.
      await supabase.from('recommendation_reviews').delete().eq('recommendation_id', recommendationId);

      const { data, error } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', recommendationId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows affected — check permissions');

      logContentModeration('admin_content_remove', recommendationId, 'recommendation', reason);
      toast({ title: 'Recommendation Deleted', description: 'The recommendation and its reviews have been removed' });
      await fetchRecommendations();
      return true;
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast({ title: 'Error', description: 'Failed to delete recommendation', variant: 'destructive' });
      return false;
    }
  }, [toast, fetchRecommendations, logContentModeration]);

  return { recommendations, loading, fetchRecommendations, fetchReviews, deleteReview, deleteRecommendation };
};
