import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { CreateReviewInput } from '@/types/recommendations';

export function useCreateReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('recommendation_reviews')
        .insert({
          ...input,
          reviewer_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recommendation-reviews', variables.recommendation_id] });
      queryClient.invalidateQueries({ queryKey: ['recommendation', variables.recommendation_id] });
      toast({
        title: "Review posted!",
        description: "Thanks for sharing your experience.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to post review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useToggleReviewHelpful() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, isHelpful }: { reviewId: string; isHelpful: boolean }) => {
      if (!user) throw new Error('Must be logged in');

      if (isHelpful) {
        const { error } = await supabase
          .from('review_reactions')
          .delete()
          .eq('user_id', user.id)
          .eq('review_id', reviewId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('review_reactions')
          .insert({
            user_id: user.id,
            review_id: reviewId,
            reaction_type: 'helpful',
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendation-reviews'] });
    },
  });
}

export function useCreateTip() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recommendationId, tipText }: { recommendationId: string; tipText: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('recommendation_tips')
        .insert({
          recommendation_id: recommendationId,
          user_id: user.id,
          tip_text: tipText,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recommendation-tips', variables.recommendationId] });
      toast({
        title: "Tip added!",
        description: "Your tip has been shared.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add tip",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
