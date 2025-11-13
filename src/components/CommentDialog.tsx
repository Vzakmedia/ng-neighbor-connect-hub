import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaperAirplaneIcon, HeartIcon } from '@heroicons/react/24/outline';
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

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postAuthor: string;
  postContent: string;
}

const CommentDialog = ({ open, onOpenChange, postId, postAuthor, postContent }: CommentDialogProps) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: { name: 'Sarah Johnson', avatar: undefined },
      content: 'This is really helpful, thanks for sharing!',
      timestamp: '2 hours ago',
      likes: 3,
      isLiked: false
    },
    {
      id: '2', 
      author: { name: 'Mike Chen', avatar: undefined },
      content: 'I had the same issue last week. Let me know if you need any help.',
      timestamp: '1 hour ago',
      likes: 1,
      isLiked: true
    }
  ]);
  const [newComment, setNewComment] = useState('');
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
      timestamp: 'Just now',
      likes: 0,
      isLiked: false
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const toggleCommentLike = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
        : comment
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
          <DialogDescription>
            View and reply to comments on this post
          </DialogDescription>
        </DialogHeader>

        {/* Original Post Preview */}
        <div className="bg-muted/50 p-3 rounded-lg mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{postAuthor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{postAuthor}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{postContent}</p>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback className="text-xs">{comment.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <div className="flex items-center mt-1 ml-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleCommentLike(comment.id)}
                      className={`h-6 px-2 text-xs ${comment.isLiked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
                    >
                      <HeartIcon className={`h-3 w-3 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                      {comment.likes > 0 && comment.likes}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Comment Input */}
        <div className="flex space-x-3 pt-4 border-t">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] resize-none"
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
              >
                <PaperAirplaneIcon className="h-3 w-3 mr-1" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;