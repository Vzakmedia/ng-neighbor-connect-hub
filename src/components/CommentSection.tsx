import { useState, useEffect, useRef } from 'react';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
}

const CommentSection = ({ postId, commentCount }: CommentSectionProps) => {
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

  const fetchComments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('id, user_id, content, created_at, parent_comment_id')
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

      // Organize comments with replies
      const organizedComments = organizeCommentsWithReplies(processedComments);
      setComments(organizedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
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
        })
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

      // Refresh comments to get the updated structure
      fetchComments();
      
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
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

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
          });

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

  // Set up safe real-time subscription for comments
  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        }, () => {
          fetchComments();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'comment_likes'
        }, () => {
          fetchComments();
        }),
      {
        channelName: `comment_section_${postId}`,
        onError: fetchComments,
        pollInterval: 45000,
        debugName: 'CommentSection'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [postId, user]);

  // Fetch available users for tagging
  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .not('full_name', 'is', null)
        .limit(50);

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setAvailableUsers(data || []);
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
    fetchComments();
    fetchAvailableUsers();
  }, [postId]);

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex space-x-3 ${isReply ? 'ml-8 mt-2' : ''}`}>
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
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
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
    <div className="border-t bg-muted/20 mt-4">
      {/* Comments List */}
      <div className="max-h-80 px-4 py-2 overflow-y-auto" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(var(--border)) transparent'
      }}>
        <style>
          {`
            .comments-container::-webkit-scrollbar {
              width: 8px;
            }
            .comments-container::-webkit-scrollbar-track {
              background: transparent;
            }
            .comments-container::-webkit-scrollbar-thumb {
              background-color: hsl(var(--border));
              border-radius: 4px;
            }
            .comments-container::-webkit-scrollbar-thumb:hover {
              background-color: hsl(var(--muted-foreground));
            }
          `}
        </style>
        <div className="comments-container space-y-3">
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
      </div>

      {/* Comment Input */}
      <div className="border-t bg-background/50 p-4">
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
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