import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

// Helper to check if messageId is a temporary/optimistic ID
const isTemporaryId = (id: string) => id.startsWith('temp-');

export const useMessageReactions = (messageId: string, currentUserId?: string) => {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchReactions = async () => {
    // Skip fetching for temporary/optimistic message IDs
    if (!messageId || isTemporaryId(messageId)) return;

    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) throw error;
      setReactions(data || []);
    } catch (error: any) {
      // Silently fail for network errors to prevent UI disruption
      if (error?.message && !error.message.includes('Failed to fetch')) {
        console.error('Error fetching reactions:', error);
      }
    }
  };

  useEffect(() => {
    // Skip for temporary/optimistic message IDs
    if (isTemporaryId(messageId)) return;

    fetchReactions();

    // Subscribe to reaction changes
    const channel = supabase
      .channel(`message-reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const addReaction = async (emoji: string) => {
    // Can't react to optimistic messages that aren't saved yet
    if (!currentUserId || isTemporaryId(messageId)) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      // If already reacted, ignore duplicate error
      if (!error.message?.includes('duplicate')) {
        toast({
          title: "Failed to add reaction",
          description: "Please try again",
          variant: "destructive"
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeReaction = async (emoji: string) => {
    if (!currentUserId || isTemporaryId(messageId)) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji);

      if (error) throw error;
      return true;
    } catch (error) {
      toast({
        title: "Failed to remove reaction",
        description: "Please try again",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleReaction = async (emoji: string) => {
    const existingReaction = reactions.find(
      r => r.user_id === currentUserId && r.emoji === emoji
    );

    if (existingReaction) {
      return await removeReaction(emoji);
    } else {
      return await addReaction(emoji);
    }
  };

  // Group reactions by emoji
  const groupedReactions: ReactionGroup[] = reactions.reduce((acc, reaction) => {
    const existing = acc.find(g => g.emoji === reaction.emoji);
    const hasReacted = reaction.user_id === currentUserId;

    if (existing) {
      existing.count++;
      existing.users.push(reaction.user_id);
      if (hasReacted) existing.hasReacted = true;
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [reaction.user_id],
        hasReacted
      });
    }

    return acc;
  }, [] as ReactionGroup[]);

  return {
    reactions,
    groupedReactions,
    loading,
    addReaction,
    removeReaction,
    toggleReaction
  };
};
