import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "@/lib/icons";
import { formatDistanceToNow } from "date-fns";

interface PollOption {
  id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
}

interface PollCardProps {
  pollId: string;
  question: string;
  closesAt: string;
  allowMultipleChoices: boolean;
  maxChoices: number;
  options: PollOption[];
  userVotes: string[];
  onVoteUpdate?: () => void;
}

export const PollCard = ({
  pollId,
  question,
  closesAt,
  allowMultipleChoices,
  maxChoices,
  options,
  userVotes,
  onVoteUpdate,
}: PollCardProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isClosed = new Date(closesAt) < new Date();
  const hasVoted = userVotes.length > 0;
  const totalVotes = options.reduce((sum, opt) => sum + opt.vote_count, 0);

  const handleOptionToggle = (optionId: string) => {
    if (isClosed || hasVoted) return;

    if (allowMultipleChoices) {
      setSelectedOptions((prev) => {
        if (prev.includes(optionId)) {
          return prev.filter((id) => id !== optionId);
        }
        if (prev.length >= maxChoices) {
          toast({
            title: "Maximum choices reached",
            description: `You can only select up to ${maxChoices} options.`,
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, optionId];
      });
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) {
      toast({
        title: "No option selected",
        description: "Please select at least one option.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const votes = selectedOptions.map((optionId) => ({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      }));

      const { error } = await supabase.from("poll_votes").insert(votes);

      if (error) throw error;

      toast({
        title: "Vote submitted!",
        description: "Your vote has been recorded.",
      });

      onVoteUpdate?.();
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({
        title: "Failed to submit vote",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{question}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isClosed
            ? "Poll ended"
            : `Ends ${formatDistanceToNow(new Date(closesAt), { addSuffix: true })}`}
        </p>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;
          const isSelected = selectedOptions.includes(option.id);
          const isUserVote = userVotes.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => handleOptionToggle(option.id)}
              disabled={isClosed || hasVoted || isSubmitting}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:bg-muted"
              } ${isClosed || hasVoted ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {allowMultipleChoices ? (
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                    </div>
                  ) : isSelected || isUserVote ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-foreground font-medium">{option.option_text}</span>
                </div>
                {(hasVoted || isClosed) && (
                  <span className="text-sm text-muted-foreground">
                    {percentage.toFixed(0)}% ({option.vote_count})
                  </span>
                )}
              </div>
              {(hasVoted || isClosed) && (
                <Progress value={percentage} className="h-2" />
              )}
            </button>
          );
        })}
      </div>

      {!hasVoted && !isClosed && (
        <Button
          onClick={handleSubmitVote}
          disabled={selectedOptions.length === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Vote"}
        </Button>
      )}

      {totalVotes > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </p>
      )}
    </div>
  );
};
