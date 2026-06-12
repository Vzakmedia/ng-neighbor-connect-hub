import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';

export interface ModeratedPoll {
  id: string;
  question: string;
  closes_at: string;
  allow_multiple_choices: boolean;
  created_at: string;
  post_id: string;
  creatorName: string | null;
  voteCount: number;
  isClosed: boolean;
}

/**
 * Admin/moderator tooling for community polls.
 * Polls have no is_active column — closing a poll sets closes_at to now.
 * Deleting a poll cascades to its options and votes.
 */
export const usePollsModeration = () => {
  const { toast } = useToast();
  const { logContentModeration } = useAdminAuditLog();
  const [polls, setPolls] = useState<ModeratedPoll[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPolls = useCallback(async (filters?: { search?: string; status?: string }) => {
    try {
      setLoading(true);

      let query = supabase
        .from('polls')
        .select('id, question, closes_at, allow_multiple_choices, created_at, post_id, community_posts!polls_post_id_fkey(user_id)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.search) {
        const term = filters.search.replace(/[%_,()]/g, '');
        if (term) query = query.ilike('question', `%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as any[];
      const ids = rows.map((p) => p.id);

      // Vote counts in one batched query
      const voteCounts = new Map<string, number>();
      if (ids.length > 0) {
        const { data: votes } = await supabase
          .from('poll_votes')
          .select('poll_id')
          .in('poll_id', ids);
        for (const v of votes || []) {
          voteCounts.set(v.poll_id, (voteCounts.get(v.poll_id) || 0) + 1);
        }
      }

      // Creator names: polls → community_posts.user_id → profiles (fetch-and-merge)
      const creatorIds = [...new Set(rows.map((p) => p.community_posts?.user_id).filter(Boolean))];
      const namesById = new Map<string, string | null>();
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);
        for (const p of profiles || []) namesById.set(p.user_id, p.full_name);
      }

      const now = Date.now();
      let merged: ModeratedPoll[] = rows.map((p) => ({
        id: p.id,
        question: p.question,
        closes_at: p.closes_at,
        allow_multiple_choices: p.allow_multiple_choices,
        created_at: p.created_at,
        post_id: p.post_id,
        creatorName: namesById.get(p.community_posts?.user_id) ?? null,
        voteCount: voteCounts.get(p.id) || 0,
        isClosed: new Date(p.closes_at).getTime() <= now,
      }));

      if (filters?.status === 'open') merged = merged.filter((p) => !p.isClosed);
      else if (filters?.status === 'closed') merged = merged.filter((p) => p.isClosed);

      setPolls(merged);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast({ title: 'Error', description: 'Failed to load polls', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const closePoll = useCallback(async (pollId: string) => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .update({ closes_at: new Date().toISOString() })
        .eq('id', pollId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows affected — check permissions');

      logContentModeration('admin_content_remove', pollId, 'poll', 'Poll closed by moderator');
      toast({ title: 'Poll Closed', description: 'Voting is no longer possible on this poll' });
      await fetchPolls();
      return true;
    } catch (error) {
      console.error('Error closing poll:', error);
      toast({ title: 'Error', description: 'Failed to close poll', variant: 'destructive' });
      return false;
    }
  }, [toast, fetchPolls, logContentModeration]);

  const deletePoll = useCallback(async (pollId: string, reason?: string) => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows affected — check permissions');

      logContentModeration('admin_content_remove', pollId, 'poll', reason);
      toast({ title: 'Poll Deleted', description: 'The poll, its options, and votes have been removed' });
      await fetchPolls();
      return true;
    } catch (error) {
      console.error('Error deleting poll:', error);
      toast({ title: 'Error', description: 'Failed to delete poll', variant: 'destructive' });
      return false;
    }
  }, [toast, fetchPolls, logContentModeration]);

  return { polls, loading, fetchPolls, closePoll, deletePoll };
};
