import { useState, useEffect, useRef } from 'react';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PaperAirplaneIcon, HeartIcon, ChatBubbleLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
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
        .from('display_profiles')
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

    // Save previous state for rollback
    const previousComments = [...comments];

    // Update UI IMMEDIATELY (optimistic)
    setComments(prev => updateCommentState(prev, commentId, {
      is_liked_by_user: !comment.is_liked_by_user,
      likes_count: comment.is_liked_by_user
        ? comment.likes_count - 1
        : comment.likes_count + 1
    }));

    // Then update backend asynchronously
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
          .insert({
            comment_id: commentId,
            user_id: user.id
          } as any);

        if (error) throw error;
      }
    } catch (error) {
      // Rollback on error
      console.error('Error toggling comment like:', error);
      setComments(previousComments);
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
        .from('display_profiles')
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

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    const comment = findComment(comments, commentId);
    if (!comment) return;

    // Optimistic UI update
    const previousComments = [...comments];
    setComments(prev => {
      const filterComments = (commentsList: Comment[]): Comment[] => {
        return commentsList.reduce((acc, c) => {
          if (c.id === commentId) return acc;
          const updated = { ...c, replies: c.replies ? filterComments(c.replies) : [] };
          acc.push(updated);
          return acc;
        }, [] as Comment[]);
      };
      return filterComments(prev);
    });

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Security: ensure user owns comment

      if (error) throw error;

      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      setComments(previousComments); // Rollback
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive",
      });
    }
  };

  const renderComment = (comment: Comment, isReply = false, isLastReply = false) => (
    <div key={comment.id} className={`relative flex gap-3 ${isReply ? 'mt-4' : 'mt-6'}`}>
      {/* Vertical spine for nested replies */}
      {isReply && (
        <div
          className="absolute -left-6 top-0 bottom-0 w-px bg-border/50"
          style={{
            height: isLastReply ? '20px' : '100%',
            borderBottomLeftRadius: isLastReply ? '12px' : '0'
          }}
        >
          {isLastReply && <div className="absolute bottom-0 left-0 w-6 h-px bg-border/50" />}
        </div>
      )}

      <div
        className="avatar-clickable cursor-pointer z-10"
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
        <div className="group relative">
          <div className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-lg px-4 py-3 border-l-4 border-primary shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold comment-text-visible truncate cursor-pointer hover:underline" onClick={() => onAvatarClick?.(comment.profiles?.full_name || 'Anonymous User')}>
                {comment.profiles?.full_name || 'Anonymous User'}
              </span>
              <span className="text-xs comment-timestamp-visible shrink-0">
                {formatTimeAgo(comment.created_at)}
              </span>
            </div>
            <p className="text-sm comment-text-visible leading-relaxed whitespace-pre-wrap break-words">
              {renderCommentContent(comment.content)}
            </p>
          </div>

          {/* Actions outside the bubble */}
          <div className="flex items-center mt-1 ml-1 space-x-4">
            <button
              onClick={() => toggleCommentLike(comment.id)}
              className={`text-xs font-medium flex items-center gap-1 transition-colors ${comment.is_liked_by_user
                ? 'text-primary dark:text-emerald-400'
                : 'text-black dark:text-emerald-400 hover:text-primary dark:hover:text-emerald-300'
                }`}
            >
              <HeartIcon className={`h-3.5 w-3.5 ${comment.is_liked_by_user ? 'fill-current' : ''}`} />
              {comment.likes_count > 0 ? (
                <span>{comment.likes_count} {comment.likes_count === 1 ? 'Like' : 'Likes'}</span>
              ) : (
                <span>Like</span>
              )}
            </button>
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs font-medium text-black dark:text-emerald-400 hover:text-primary dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
              Reply
            </button>

            {user && user.id === comment.user_id && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors ml-auto mr-2"
                title="Delete comment"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex gap-3">
              <div
                className="shrink-0 cursor-pointer"
                onClick={() => onAvatarClick?.(profile?.full_name || 'You', profile?.avatar_url || undefined)}
              >
                <OnlineAvatar
                  userId={user?.id}
                  src={profile?.avatar_url || undefined}
                  fallback={profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  size="sm"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <Textarea
                    ref={replyTextareaRef}
                    placeholder={`Reply to ${comment.profiles?.full_name}...`}
                    value={replyText}
                    onChange={(e) => handleTextChange(e.target.value, 'reply')}
                    className="min-h-[40px] py-2 bg-background resize-none text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500"
                    rows={1}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment(comment.id);
                      }
                    }}
                  />
                  {showUserSuggestions && activeTextarea === 'reply' && (
                    <div className="absolute top-full left-0 w-full max-w-xs mt-1 bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
                      <Command>
                        <CommandList className="max-h-32">
                          {filteredUsers.length === 0 ? (
                            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">No users found.</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {filteredUsers.slice(0, 5).map((user) => (
                                <CommandItem
                                  key={user.user_id}
                                  onSelect={() => handleUserSelect(user)}
                                  className="flex items-center gap-2 cursor-pointer py-2 px-3"
                                >
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={user.avatar_url || undefined} />
                                    <AvatarFallback className="text-[10px]">
                                      {user.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs">{user.full_name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    className="h-7 text-xs rounded-full px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs rounded-full px-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    onClick={() => handleSubmitComment(comment.id)}
                    disabled={!replyText.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render replies with indentation */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="pl-2">
            {comment.replies.map((reply, index) => renderComment(reply, true, index === comment.replies!.length - 1))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full ${isInline ? 'bg-white dark:bg-gray-900' : 'border-t bg-white dark:bg-gray-900 mt-4'}`}>
      {/* Main comment input - Fixed at bottom if needed, or top/bottom logic */}
      <div className={`p-4 ${isInline ? 'border-b pb-4 bg-white dark:bg-gray-900' : 'border-t order-last bg-white dark:bg-gray-900'}`}>
        <div className="flex gap-3">
          <div className="shrink-0 mt-1">
            <OnlineAvatar
              userId={user?.id}
              src={profile?.avatar_url || undefined}
              fallback={profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              size="md"
            />
          </div>
          <div className="flex-1 relative group">
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl border-2 border-emerald-500 dark:border-emerald-600 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 shadow-sm transition-all">
              <Textarea
                ref={textareaRef}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => handleTextChange(e.target.value, 'main')}
                className="min-h-[44px] max-h-32 py-3 px-4 resize-none text-sm bg-transparent border-0 focus-visible:ring-0 shadow-none rounded-3xl pr-12"
                rows={1}
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
                  onClick={() => handleSubmitComment()}
                  disabled={!newComment.trim()}
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span className="sr-only">Post</span>
                </Button>
              </div>
            </div>

            {showUserSuggestions && activeTextarea === 'main' && (
              <div className="absolute bottom-full left-0 w-full max-w-xs mb-2 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <Command>
                  <CommandList className="max-h-48">
                    {filteredUsers.length === 0 ? (
                      <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">No users found.</CommandEmpty>
                    ) : (
                      <CommandGroup heading="Suggestions">
                        {filteredUsers.slice(0, 5).map((user) => (
                          <CommandItem
                            key={user.user_id}
                            onSelect={() => handleUserSelect(user)}
                            className="flex items-center gap-3 cursor-pointer py-2.5 px-3 hover:bg-muted/50 transition-colors"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {user.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{user.full_name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments list */}
      <ScrollArea className={`${isInline ? 'flex-1' : 'max-h-[500px]'} px-4 py-2`}>
        <div className="space-y-1 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 opacity-50 space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-xs text-muted-foreground">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 bg-muted/10 rounded-xl my-4">
              <p className="text-muted-foreground font-medium">No comments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map(comment => renderComment(comment))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommentSection;