import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PollData {
  id: string;
  question: string;
  closes_at: string;
  allow_multiple_choices: boolean;
  max_choices: number;
}

interface PollOption {
  id: string;
  option_text: string;
  option_order: number;
}

interface PollVote {
  option_id: string;
  user_id: string;
}

export const usePoll = (postId: string) => {
  const queryClient = useQueryClient();

  const { data: pollData, isLoading } = useQuery({
    queryKey: ["poll", postId],
    queryFn: async () => {
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .select("*")
        .eq("post_id", postId)
        .maybeSingle();

      if (pollError) throw pollError;

      // Handle case where no poll exists for this post
      if (!poll) {
        return {
          poll: null,
          options: [],
          userVotes: [],
        };
      }

      const { data: options, error: optionsError } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", poll.id)
        .order("option_order");

      if (optionsError) throw optionsError;

      const { data: votes, error: votesError } = await supabase
        .from("poll_votes")
        .select("option_id, user_id")
        .eq("poll_id", poll.id);

      if (votesError) throw votesError;

      const { data: { user } } = await supabase.auth.getUser();

      const optionsWithVotes = options.map((option) => ({
        ...option,
        vote_count: votes.filter((v) => v.option_id === option.id).length,
      }));

      const userVotes = user
        ? votes.filter((v) => v.user_id === user.id).map((v) => v.option_id)
        : [];

      return {
        poll,
        options: optionsWithVotes,
        userVotes,
      };
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (optionIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const votes = optionIds.map((optionId) => ({
        poll_id: pollData?.poll.id,
        option_id: optionId,
        user_id: user.id,
      }));

      const { error } = await supabase.from("poll_votes").insert(votes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll", postId] });
    },
  });

  return {
    poll: pollData?.poll,
    options: pollData?.options || [],
    userVotes: pollData?.userVotes || [],
    isLoading,
    submitVote: voteMutation.mutate,
    isSubmitting: voteMutation.isPending,
  };
};
