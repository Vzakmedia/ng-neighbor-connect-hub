import { useState, useEffect, useRef } from 'react';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  parent_comment_id: string | null;
  profiles: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  is_liked_by_user: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  onAvatarClick?: (name: string, avatar?: string) => void;
  isInline?: boolean;
}

const CommentSection = ({ postId, commentCount, onAvatarClick, isInline = false }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [currentMentionQuery, setCurrentMentionQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [activeTextarea, setActiveTextarea] = useState<'main' | 'reply'>('main');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
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

  const fetchComments = async (silent = false) => {
    if (!user) return;
    
    if (!silent) {
      setLoading(true);
    }
    
    try {
      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('id, user_id, content, created_at, parent_comment_id')
        .eq('post_id', postId as any)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }

      // Get user IDs and fetch profiles separately
      const userIds = [...new Set(commentsData?.map((comment: any) => comment?.user_id).filter(Boolean) || [])];
      
      const { data: profilesDataRaw, error: profilesError } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Get comment IDs for like counting
      const commentIds = commentsData?.map((comment: any) => comment?.id).filter(Boolean) || [];
      
      // Fetch like counts and user-like flags via secure RPC
      const { data: likesSummary, error: likesError }: { data: any[]; error: any } = await (supabase as any)
        .rpc('get_comment_likes', { _comment_ids: commentIds });

      if (likesError) {
        console.error('Error fetching comment likes:', likesError);
      }

      // Create profiles map (transform public_profiles to expected shape)
      const profilesData = (profilesDataRaw || []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.display_name ?? null,
        avatar_url: p.avatar_url ?? null,
      }));
      const profilesMap = new Map(profilesData.map((profile: any) => [profile.user_id, profile]));

      // Process comments with like information and profiles
      const processedComments = commentsData?.map((comment: any) => {
        if (!comment || typeof comment !== 'object') return null;
        return {
          ...comment,
          profiles: profilesMap.get(comment.user_id) || null,
          likes_count: likesSummary?.find((l: any) => l.comment_id === comment.id)?.likes_count || 0,
          is_liked_by_user: likesSummary?.find((l: any) => l.comment_id === comment.id)?.liked_by_user || false
        };
      }).filter(Boolean) || [];

      // Organize comments with replies
      const organizedComments = organizeCommentsWithReplies(processedComments);
      setComments(organizedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const organizeCommentsWithReplies = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const handleSubmitComment = async (parentCommentId?: string) => {
    const content = parentCommentId ? replyText : newComment;
    if (!content.trim() || !user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          parent_comment_id: parentCommentId || null
        } as any)
        .select('id, user_id, content, created_at, parent_comment_id')
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

      // Silently refresh comments to get the updated structure
      fetchComments(true);
      
      if (parentCommentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }

      toast({
        title: parentCommentId ? "Reply posted" : "Comment posted",
        description: parentCommentId ? "Your reply has been added successfully." : "Your comment has been added successfully.",
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

  // Helper function to find a comment at any nesting level
  const findComment = (comments: Comment[], commentId: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === commentId) return comment;
      if (comment.replies) {
        const found = findComment(comment.replies, commentId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to update comment state at any nesting level
  const updateCommentState = (comments: Comment[], commentId: string, updates: Partial<Comment>): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, ...updates };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentState(comment.replies, commentId, updates)
        };
      }
      return comment;
    });
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) return;

    const comment = findComment(comments, commentId);
    if (!comment) return;

    try {
      if (comment.is_liked_by_user) {
        // Unlike the comment
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId as any)
          .eq('user_id', user.id as any);

        if (error) throw error;

        // Update local state
        setComments(prev => updateCommentState(prev, commentId, {
          is_liked_by_user: false,
          likes_count: comment.likes_count - 1
        }));
      } else {
        // Like the comment
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          } as any);

        if (error) throw error;

        // Update local state
        setComments(prev => updateCommentState(prev, commentId, {
          is_liked_by_user: true,
          likes_count: comment.likes_count + 1
        }));
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

  // Enhanced real-time subscription for comprehensive comment updates
  useEffect(() => {
    if (!user) return;

    console.log(`CommentSection: Setting up comprehensive real-time for post ${postId}`);

    const subscription = createSafeSubscription(
      (channel) => channel
        // Listen to comment changes for this specific post
        .on('postgres_changes', {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        }, (payload) => {
          console.log('CommentSection: Comment change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Silently refresh comments to get the new comment with profile data
            fetchComments(true);
          } else if (payload.eventType === 'UPDATE') {
            // Comment updated - silently refresh to get updated content
            fetchComments(true);
          } else if (payload.eventType === 'DELETE') {
            // Comment deleted - remove from state immediately
            setComments(prev => {
              const filterComments = (comments: Comment[]): Comment[] => {
                return comments.reduce((acc, comment) => {
                  if (comment.id === payload.old.id) {
                    return acc; // Skip deleted comment
                  }
                  
                  const updatedComment = {
                    ...comment,
                    replies: comment.replies ? filterComments(comment.replies) : []
                  };
                  
                  acc.push(updatedComment);
                  return acc;
                }, [] as Comment[]);
              };
              
              return filterComments(prev);
            });
          }
        })
        // Listen to comment likes changes
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'comment_likes'
        }, (payload) => {
          console.log('CommentSection: Comment like change detected:', payload);
          
          const commentId = payload.new?.comment_id || payload.old?.comment_id;
          if (!commentId) return;

          // Update like count and status in real-time
          setComments(prev => {
            const updateCommentLikes = (comments: Comment[]): Comment[] => {
              return comments.map(comment => {
                if (comment.id === commentId) {
                  if (payload.eventType === 'INSERT') {
                    return {
                      ...comment,
                      likes_count: comment.likes_count + 1,
                      is_liked_by_user: payload.new.user_id === user.id ? true : comment.is_liked_by_user
                    };
                  } else if (payload.eventType === 'DELETE') {
                    return {
                      ...comment,
                      likes_count: Math.max(0, comment.likes_count - 1),
                      is_liked_by_user: payload.old.user_id === user.id ? false : comment.is_liked_by_user
                    };
                  }
                }
                
                // Also check replies
                if (comment.replies) {
                  return {
                    ...comment,
                    replies: updateCommentLikes(comment.replies)
                  };
                }
                
                return comment;
              });
            };
            
            return updateCommentLikes(prev);
          });
        }),
      {
        channelName: `comment_section_comprehensive_${postId}`,
        onError: () => {
          console.log('CommentSection: Real-time error, silently refreshing comments');
          fetchComments(true);
        },
        pollInterval: 15000, // Poll every 15 seconds for comments
        debugName: 'CommentSectionComprehensive'
      }
    );

    return () => {
      console.log(`CommentSection: Cleaning up real-time for post ${postId}`);
      subscription?.unsubscribe();
    };
  }, [postId, user]);

  // Fetch available users for tagging
  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url')
        
        .limit(50);

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setAvailableUsers((data || []).map((u: any) => ({ user_id: u.user_id, full_name: u.display_name, avatar_url: u.avatar_url })));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Handle @ mention detection
  const handleTextChange = (text: string, textarea: 'main' | 'reply') => {
    if (textarea === 'main') {
      setNewComment(text);
    } else {
      setReplyText(text);
    }

    const currentRef = textarea === 'main' ? textareaRef : replyTextareaRef;
    const cursorPosition = currentRef.current?.selectionStart || 0;
    
    // Find the last @ symbol before cursor
    const textBeforeCursor = text.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const afterAt = textBeforeCursor.substring(atIndex + 1);
      
      // Check if we're still in a mention (no spaces after @)
      if (!afterAt.includes(' ') && afterAt.length > 0) {
        setCurrentMentionQuery(afterAt);
        setMentionPosition({ start: atIndex, end: cursorPosition });
        setActiveTextarea(textarea);
        setShowUserSuggestions(true);
        
        // Filter users based on query
        const filtered = availableUsers.filter(user =>
          user.full_name?.toLowerCase().includes(afterAt.toLowerCase())
        );
        setFilteredUsers(filtered);
      } else if (afterAt.length === 0) {
        // Just typed @, show all users
        setCurrentMentionQuery('');
        setMentionPosition({ start: atIndex, end: cursorPosition });
        setActiveTextarea(textarea);
        setShowUserSuggestions(true);
        setFilteredUsers(availableUsers);
      } else {
        setShowUserSuggestions(false);
      }
    } else {
      setShowUserSuggestions(false);
    }
  };

  // Handle user selection for mention
  const handleUserSelect = (user: any) => {
    const currentText = activeTextarea === 'main' ? newComment : replyText;
    const beforeMention = currentText.substring(0, mentionPosition.start);
    const afterMention = currentText.substring(mentionPosition.end);
    const newText = `${beforeMention}@${user.full_name} ${afterMention}`;
    
    if (activeTextarea === 'main') {
      setNewComment(newText);
    } else {
      setReplyText(newText);
    }
    
    setShowUserSuggestions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      const ref = activeTextarea === 'main' ? textareaRef : replyTextareaRef;
      ref.current?.focus();
    }, 100);
  };

  // Render comment content with highlighted mentions
  const renderCommentContent = (content: string) => {
    const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span key={index} className="text-primary font-medium bg-primary/10 px-1 rounded">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  // Fetch comments when component mounts
  useEffect(() => {
    fetchComments(false); // Initial load with loading state
    fetchAvailableUsers();
  }, [postId]);

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex space-x-3 ${isReply ? 'ml-8 mt-2' : ''}`}>
      <div 
        className="avatar-clickable cursor-pointer"
        onClick={() => onAvatarClick?.(comment.profiles?.full_name || 'Anonymous User', comment.profiles?.avatar_url || undefined)}
      >
        <OnlineAvatar
          userId={comment.user_id}
          src={comment.profiles?.avatar_url || undefined}
          fallback={comment.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
          size="md"
          className="hover:ring-2 hover:ring-primary/50 transition-all"
        />
      </div>
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
          <p className="text-sm break-words">{renderCommentContent(comment.content)}</p>
        </div>
        <div className="flex items-center mt-1 ml-2 space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => toggleCommentLike(comment.id)}
            className={`h-6 px-2 text-xs ${comment.is_liked_by_user ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
          >
            <Heart className={`h-3 w-3 mr-1 ${comment.is_liked_by_user ? 'fill-current' : ''}`} />
            {comment.likes_count > 0 && comment.likes_count}
          </Button>
          {!isReply && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
        
        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="mt-3 ml-2">
            <div className="flex space-x-2">
              <div 
                className="avatar-clickable cursor-pointer"
                onClick={() => onAvatarClick?.(profile?.full_name || 'You', profile?.avatar_url || undefined)}
              >
                <OnlineAvatar
                  userId={user?.id}
                  src={profile?.avatar_url || undefined}
                  fallback={profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  size="sm"
                  className="hover:ring-2 hover:ring-primary/50 transition-all"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <Textarea
                    ref={replyTextareaRef}
                    placeholder={`Reply to ${comment.profiles?.full_name || 'this comment'}...`}
                    value={replyText}
                    onChange={(e) => handleTextChange(e.target.value, 'reply')}
                    className="min-h-[60px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment(comment.id);
                      }
                    }}
                  />
                  {showUserSuggestions && activeTextarea === 'reply' && (
                    <div className="absolute bottom-full left-0 w-full max-w-xs mb-1 bg-background border rounded-md shadow-lg z-50">
                      <Command>
                        <CommandList className="max-h-32">
                          {filteredUsers.length === 0 ? (
                            <CommandEmpty>No users found.</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {filteredUsers.slice(0, 5).map((user) => (
                                <CommandItem
                                  key={user.user_id}
                                  onSelect={() => handleUserSelect(user)}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={user.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {user.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{user.full_name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost"
                    size="sm" 
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleSubmitComment(comment.id)}
                    disabled={!replyText.trim()}
                    className="text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`space-y-4 ${isInline ? '' : 'border-t bg-muted/20 mt-4 p-4'}`}>
      {/* Comments list */}
      <div className={isInline ? "h-64 overflow-hidden" : ""}>
        <ScrollArea className={isInline ? "h-full pr-4" : "max-h-96 pr-4"}>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main comment input */}
      <div className={`mt-4 pt-3 ${isInline ? 'border-t-0' : 'border-t'}`}>
        <div className="flex space-x-3">
          <div 
            className="avatar-clickable cursor-pointer"
            onClick={() => onAvatarClick?.(profile?.full_name || 'You', profile?.avatar_url || undefined)}
          >
            <OnlineAvatar
              userId={user?.id}
              src={profile?.avatar_url || undefined}
              fallback={profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              size="md"
              className="hover:ring-2 hover:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex-1 space-y-2 relative">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => handleTextChange(e.target.value, 'main')}
                className="min-h-[60px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              {showUserSuggestions && activeTextarea === 'main' && (
                <div className="absolute bottom-full left-0 w-full max-w-xs mb-1 bg-background border rounded-md shadow-lg z-50">
                  <Command>
                    <CommandList className="max-h-32">
                      {filteredUsers.length === 0 ? (
                        <CommandEmpty>No users found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {filteredUsers.slice(0, 5).map((user) => (
                            <CommandItem
                              key={user.user_id}
                              onSelect={() => handleUserSelect(user)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {user.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{user.full_name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={() => handleSubmitComment()}
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
  );
};

export default CommentSection;