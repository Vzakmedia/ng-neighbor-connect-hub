import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaperAirplaneIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
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
  replies?: Comment[];
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
            {comments.map((comment, index) => (
              <div key={comment.id} className="relative flex gap-3">
                <Avatar className="h-8 w-8 z-10 mt-1 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback className="text-[10px]">{comment.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="group relative">
                    <div className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-lg px-4 py-3 border-l-4 border-primary shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold comment-text-visible truncate">
                          {comment.author.name}
                        </span>
                        <span className="text-xs comment-timestamp-visible shrink-0">
                          {comment.timestamp}
                        </span>
                      </div>
                      <p className="text-sm comment-text-visible leading-relaxed whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>

                    <div className="flex items-center mt-1 ml-1 space-x-4">
                      <button
                        onClick={() => toggleCommentLike(comment.id)}
                        className={`text-xs font-medium flex items-center gap-1 transition-colors ${comment.isLiked
                          ? 'text-primary dark:text-emerald-400'
                          : 'text-slate-700 dark:text-emerald-400 hover:text-primary dark:hover:text-emerald-300'
                          }`}
                      >
                        <HeartIcon className={`h-3.5 w-3.5 ${comment.isLiked ? 'fill-current' : ''}`} />
                        {comment.likes > 0 ? (
                          <span>{comment.likes} {comment.likes === 1 ? 'Like' : 'Likes'}</span>
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
            ))}

            {comments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
              </div>
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
                    disabled={!newComment.trim()}
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