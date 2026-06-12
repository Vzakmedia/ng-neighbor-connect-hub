import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';

export interface ModeratedBoard {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  archived_at: string | null;
  created_at: string;
  creator_id: string;
  profiles?: { full_name: string | null } | null;
  memberCount: number;
  postCount: number;
}

export interface ModeratedBoardPost {
  id: string;
  content: string;
  created_at: string;
  approval_status: string | null;
  user_id: string;
  profiles?: { full_name: string | null } | null;
}

/**
 * Admin/moderator tooling for discussion boards (groups).
 * Deleting a board cascades to its members and posts.
 */
export const useBoardsModeration = () => {
  const { toast } = useToast();
  const { logContentModeration } = useAdminAuditLog();
  const [boards, setBoards] = useState<ModeratedBoard[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBoards = useCallback(async (filters?: { search?: string; status?: string }) => {
    try {
      setLoading(true);

      let query = supabase
        .from('discussion_boards')
        .select('id, name, description, is_private, archived_at, created_at, creator_id, profiles!discussion_boards_creator_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters?.search) {
        const term = filters.search.replace(/[%_,()]/g, '');
        if (term) query = query.ilike('name', `%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as any[];
      const ids = rows.map((b) => b.id);

      // Member and post counts batched over the current page
      const memberCounts = new Map<string, number>();
      const postCounts = new Map<string, number>();
      if (ids.length > 0) {
        const [{ data: members }, { data: posts }] = await Promise.all([
          supabase.from('board_members').select('board_id').in('board_id', ids),
          supabase.from('board_posts').select('board_id').in('board_id', ids),
        ]);
        for (const m of members || []) memberCounts.set(m.board_id, (memberCounts.get(m.board_id) || 0) + 1);
        for (const p of posts || []) postCounts.set(p.board_id, (postCounts.get(p.board_id) || 0) + 1);
      }

      let merged: ModeratedBoard[] = rows.map((b) => ({
        ...b,
        memberCount: memberCounts.get(b.id) || 0,
        postCount: postCounts.get(b.id) || 0,
      }));

      if (filters?.status === 'archived') merged = merged.filter((b) => b.archived_at);
      else if (filters?.status === 'active') merged = merged.filter((b) => !b.archived_at);

      setBoards(merged);
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast({ title: 'Error', description: 'Failed to load discussion boards', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const archiveBoard = useCallback(async (boardId: string, reason?: string) => {
    try {
      const { data, error } = await supabase
        .from('discussion_boards')
        .update({ archived_at: new Date().toISOString(), discoverable: false } as any)
        .eq('id', boardId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows affected — check permissions');

      logContentModeration('admin_content_remove', boardId, 'discussion_board', reason);
      toast({ title: 'Board Archived', description: 'The board is no longer discoverable' });
      await fetchBoards();
      return true;
    } catch (error) {
      console.error('Error archiving board:', error);
      toast({ title: 'Error', description: 'Failed to archive board', variant: 'destructive' });
      return false;
    }
  }, [toast, fetchBoards, logContentModeration]);

  const deleteBoard = useCallback(async (boardId: string, reason?: string) => {
    try {
      const { data, error } = await supabase
        .from('discussion_boards')
        .delete()
        .eq('id', boardId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows affected — check permissions');

      logContentModeration('admin_content_remove', boardId, 'discussion_board', reason);
      toast({ title: 'Board Deleted', description: 'The board, its members, and posts have been removed' });
      await fetchBoards();
      return true;
    } catch (error) {
      console.error('Error deleting board:', error);
      toast({ title: 'Error', description: 'Failed to delete board', variant: 'destructive' });
      return false;
    }
  }, [toast, fetchBoards, logContentModeration]);

  const fetchBoardPosts = useCallback(async (boardId: string): Promise<ModeratedBoardPost[]> => {
    try {
      const { data, error } = await supabase
        .from('board_posts')
        .select('id, content, created_at, approval_status, user_id, profiles!user_id(full_name)')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as ModeratedBoardPost[];
    } catch (error) {
      console.error('Error fetching board posts:', error);
      toast({ title: 'Error', description: 'Failed to load board posts', variant: 'destructive' });
      return [];
    }
  }, [toast]);

  const deleteBoardPost = useCallback(async (postId: string, reason?: string) => {
    try {
      const { data, error } = await supabase
        .from('board_posts')
        .delete()
        .eq('id', postId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows affected — check permissions');

      logContentModeration('admin_content_remove', postId, 'board_post', reason);
      toast({ title: 'Post Removed', description: 'The board post has been deleted' });
      return true;
    } catch (error) {
      console.error('Error deleting board post:', error);
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
      return false;
    }
  }, [toast, logContentModeration]);

  return { boards, loading, fetchBoards, archiveBoard, deleteBoard, fetchBoardPosts, deleteBoardPost };
};
