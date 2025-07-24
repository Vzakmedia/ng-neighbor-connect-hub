import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  is_liked_by_user: boolean;
}

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

const CommentSection = ({ postId, commentCount, isOpen, onToggle }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const fetchComments = async () => {
    if (!isOpen || !user) return;
    
    setLoading(true);
    try {
      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('id, user_id, content, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }

      // Get user IDs and fetch profiles separately
      const userIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Get comment IDs for like counting
      const commentIds = commentsData?.map(comment => comment.id) || [];
      
      // Fetch like counts for each comment
      const { data: likesData, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds);

      if (likesError) {
        console.error('Error fetching comment likes:', likesError);
      }

      // Create profiles map
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      // Process comments with like information and profiles
      const processedComments = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || null,
        likes_count: likesData?.filter(like => like.comment_id === comment.id).length || 0,
        is_liked_by_user: likesData?.some(like => like.comment_id === comment.id && like.user_id === user.id) || false
      })) || [];

      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        })
        .select('id, user_id, content, created_at')
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        toast({
          title: "Error",
          description: "Failed to post comment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Add the new comment to the list with current user's profile
      const newCommentWithLikes = {
        ...data,
        profiles: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        },
        likes_count: 0,
        is_liked_by_user: false
      };

      setComments(prev => [...prev, newCommentWithLikes]);
      setNewComment('');

      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    try {
      if (comment.is_liked_by_user) {
        // Unlike the comment
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, is_liked_by_user: false, likes_count: c.likes_count - 1 }
            : c
        ));
      } else {
        // Like the comment
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;

        // Update local state
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, is_liked_by_user: true, likes_count: c.likes_count + 1 }
            : c
        ));
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscription for comments
  useEffect(() => {
    if (!isOpen || !user) return;

    const channel = supabase
      .channel(`post_comments_${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_likes'
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, postId, user]);

  // Fetch comments when section opens
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen]);

  return (
    <>
      {/* Comment Toggle Button */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onToggle}
        className="text-muted-foreground hover:text-primary"
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        {commentCount}
      </Button>

      {/* Comment Section */}
      {isOpen && (
        <div className="border-t bg-muted/20 mt-4">
          {/* Comments List */}
          <ScrollArea className="max-h-80 px-4 py-2">
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {comment.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-background rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">
                            {comment.profiles?.full_name || 'Anonymous User'}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm break-words">{comment.content}</p>
                      </div>
                      <div className="flex items-center mt-1 ml-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleCommentLike(comment.id)}
                          className={`h-6 px-2 text-xs ${comment.is_liked_by_user ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
                        >
                          <Heart className={`h-3 w-3 mr-1 ${comment.is_liked_by_user ? 'fill-current' : ''}`} />
                          {comment.likes_count > 0 && comment.likes_count}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Comment Input */}
          <div className="border-t bg-background/50 p-4">
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommentSection;