import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Recommendation, RecommendationFilters, CreateRecommendationInput } from '@/types/recommendations';

const ITEMS_PER_PAGE = 20;

export function useRecommendations(filters: RecommendationFilters = {}) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['recommendations', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('recommendations')
        .select(`
          *,
          author:profiles!recommendations_user_id_fkey(user_id, full_name, avatar_url),
          is_saved:saved_recommendations!left(id),
          is_liked:recommendation_likes!left(id)
        `, { count: 'exact' })
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(pageParam * ITEMS_PER_PAGE, (pageParam + 1) * ITEMS_PER_PAGE - 1);

      // Apply filters
      if (filters.type) {
        query = query.eq('recommendation_type', filters.type);
      }
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }
      if (filters.priceRange && filters.priceRange.length > 0) {
        query = query.in('price_range', filters.priceRange);
      }
      if (filters.minRating) {
        query = query.gte('average_rating', filters.minRating);
      }
      if (filters.verifiedOnly) {
        query = query.eq('is_verified', true);
      }
      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      if (filters.state) {
        query = query.eq('state', filters.state);
      }
      if (filters.neighborhood) {
        query = query.eq('neighborhood', filters.neighborhood);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data
      const recommendations: Recommendation[] = (data || []).map(item => ({
        ...item,
        is_saved: user ? (item.is_saved as any[]).some((s: any) => s.user_id === user.id) : false,
        is_liked: user ? (item.is_liked as any[]).some((l: any) => l.user_id === user.id) : false,
      }));

      return {
        recommendations,
        nextPage: data && data.length === ITEMS_PER_PAGE ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

export function useCreateRecommendation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecommendationInput) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('recommendations')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      toast({
        title: "Recommendation submitted!",
        description: "Your recommendation is pending approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create recommendation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useToggleSave() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recommendationId, isSaved, collectionName = 'Favorites' }: { 
      recommendationId: string; 
      isSaved: boolean;
      collectionName?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      if (isSaved) {
        const { error } = await supabase
          .from('saved_recommendations')
          .delete()
          .eq('user_id', user.id)
          .eq('recommendation_id', recommendationId)
          .eq('collection_name', collectionName);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_recommendations')
          .insert({
            user_id: user.id,
            recommendation_id: recommendationId,
            collection_name: collectionName,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['saved-recommendations'] });
      toast({
        title: variables.isSaved ? "Removed from saves" : "Saved!",
        description: variables.isSaved ? undefined : `Added to ${variables.collectionName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useToggleLike() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recommendationId, isLiked }: { recommendationId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Must be logged in');

      if (isLiked) {
        const { error } = await supabase
          .from('recommendation_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('recommendation_id', recommendationId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recommendation_likes')
          .insert({
            user_id: user.id,
            recommendation_id: recommendationId,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}
