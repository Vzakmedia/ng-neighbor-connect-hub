import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaperAirplaneIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  likes_count: number;
  is_liked_by_user: boolean;
}

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postAuthor: string;
  postContent: string;
}

const CommentDialog = ({ open, onOpenChange, postId, postAuthor, postContent }: CommentDialogProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const fetchComments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('id, user_id, content, created_at')
        .eq('post_id', postId as any)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userIds = [...new Set((commentsData || []).map((c: any) => c.user_id).filter(Boolean))];
      const { data: profilesRaw } = await supabase
        .from('display_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profilesRaw || []).map((p: any) => [p.user_id, { full_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null }])
      );

      const commentIds = (commentsData || []).map((c: any) => c.id);
      const { data: likesSummary }: { data: any[] } = await (supabase as any)
        .rpc('get_comment_likes', { _comment_ids: commentIds });

      setComments(
        (commentsData || []).map((c: any) => ({
          ...c,
          profiles: profilesMap.get(c.user_id) || null,
          likes_count: likesSummary?.find((l: any) => l.comment_id === c.id)?.likes_count || 0,
          is_liked_by_user: likesSummary?.find((l: any) => l.comment_id === c.id)?.liked_by_user || false,
        }))
      );
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchComments();
  }, [open, postId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !profile || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: user.id, content: newComment.trim() } as any);

      if (error) throw error;
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({ title: 'Error', description: 'Failed to post comment.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const previousComments = [...comments];
    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? { ...c, is_liked_by_user: !c.is_liked_by_user, likes_count: c.likes_count + (c.is_liked_by_user ? -1 : 1) }
          : c
      )
    );

    try {
      if (comment.is_liked_by_user) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId as any)
          .eq('user_id', user.id as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: user.id } as any);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setComments(previousComments);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-md">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Comments</DialogTitle>
          <DialogDescription>
            View and reply to comments on this post
          </DialogDescription>
        </DialogHeader>

        {/* Original Post Preview */}
        <div className="bg-muted/30 p-4 border-b">
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">{postAuthor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{postAuthor}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 pl-8 border-l-2 border-primary/20">{postContent}</p>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="relative flex gap-3">
                  <Avatar className="h-8 w-8 z-10 mt-1">
                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {comment.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="group relative">
                      <div className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-lg px-4 py-3 border-l-4 border-primary shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold comment-text-visible truncate">
                            {comment.profiles?.full_name || 'Anonymous'}
                          </span>
                          <span className="text-xs comment-timestamp-visible shrink-0">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm comment-text-visible leading-relaxed whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>

                      <div className="flex items-center mt-1 ml-1 space-x-4">
                        <button
                          onClick={() => toggleCommentLike(comment.id)}
                          className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                            comment.is_liked_by_user
                              ? 'text-primary dark:text-emerald-400'
                              : 'text-slate-700 dark:text-emerald-400 hover:text-primary dark:hover:text-emerald-300'
                          }`}
                        >
                          <HeartIcon className={`h-3.5 w-3.5 ${comment.is_liked_by_user ? 'fill-current' : ''}`} />
                          {comment.likes_count > 0 ? (
                            <span>{comment.likes_count} {comment.likes_count === 1 ? 'Like' : 'Likes'}</span>
                          ) : (
                            <span>Like</span>
                          )}
                        </button>
                        <button className="text-xs font-medium text-slate-700 dark:text-emerald-400 hover:text-primary dark:hover:text-emerald-300 flex items-center gap-1 transition-colors">
                          <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Comment Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">{profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl border-2 border-emerald-500 dark:border-emerald-600 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 shadow-sm transition-all">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[44px] max-h-32 py-3 px-4 resize-none text-sm bg-transparent border-0 focus-visible:ring-0 shadow-none rounded-3xl pr-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <div className="absolute right-1.5 bottom-1.5">
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full shrink-0 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    <span className="sr-only">Post</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
