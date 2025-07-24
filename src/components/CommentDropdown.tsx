import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

interface CommentDropdownProps {
  postId: string;
  commentCount: number;
  onCommentCountChange: (newCount: number) => void;
}

const CommentDropdown = ({ postId, commentCount, onCommentCountChange }: CommentDropdownProps) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: { name: 'Sarah Johnson', avatar: undefined },
      content: 'This is really helpful, thanks for sharing!',
      timestamp: '2h',
      likes: 3,
      isLiked: false
    },
    {
      id: '2', 
      author: { name: 'Mike Chen', avatar: undefined },
      content: 'I had the same issue last week. Let me know if you need any help.',
      timestamp: '1h',
      likes: 1,
      isLiked: true
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user || !profile) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: profile.full_name || 'Anonymous User',
        avatar: profile.avatar_url || undefined
      },
      content: newComment,
      timestamp: 'now',
      likes: 0,
      isLiked: false
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment('');
    onCommentCountChange(updatedComments.length);
  };

  const toggleCommentLike = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
        : comment
    ));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <MessageCircle className="h-4 w-4 mr-1" />
          {commentCount}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-background border shadow-lg z-50" 
        align="start"
        side="bottom"
      >
        <div className="max-h-96 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-background">
            <h4 className="text-sm font-semibold">Comments</h4>
          </div>

          {/* Comments List */}
          <ScrollArea className="flex-1 max-h-64">
            <div className="space-y-3 p-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback className="text-xs">{comment.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm break-words">{comment.content}</p>
                      </div>
                      <div className="flex items-center mt-1 ml-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleCommentLike(comment.id)}
                          className={`h-6 px-2 text-xs ${comment.isLiked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
                        >
                          <Heart className={`h-3 w-3 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                          {comment.likes > 0 && comment.likes}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Comment Input */}
          <div className="border-t bg-background p-4">
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
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
      </PopoverContent>
    </Popover>
  );
};

export default CommentDropdown;