import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnlineAvatar from '@/components/OnlineAvatar';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  MapPin,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Users,
  Bookmark,
  Calendar,
  X
} from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import CommentSection from '@/components/CommentSection';
import ShareDialog from '@/components/ShareDialog';
import { ImageGalleryDialog } from '@/components/ImageGalleryDialog';
import { VideoPlayerDialog } from '@/components/VideoPlayerDialog';
import { Play } from '@/lib/icons';

interface Post {
  id: string;
  user_id: string;
  author: {
    name: string;
    avatar?: string;
    location: string;
  };
  content: string;
  title?: string;
  type: 'general' | 'safety' | 'marketplace' | 'help' | 'event';
  timestamp: string;
  likes: number;
  comments: number;
  images?: string[];
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  tags?: string[];
  isLiked: boolean;
  isSaved: boolean;
}

interface PostFullScreenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (post: Post) => void;
  onProfileClick: (authorName: string, authorAvatar?: string) => void;
}

export const PostFullScreenDialog = ({ 
  isOpen, 
  onClose, 
  post, 
  onLike, 
  onSave, 
  onShare,
  onProfileClick 
}: PostFullScreenDialogProps) => {
  const [showComments, setShowComments] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setShowComments(false);
  }, [post]);

  // Early return AFTER all hooks are called
  if (!post) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-8 text-center text-muted-foreground">
            No post selected
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'marketplace':
        return <ShoppingCart className="h-4 w-4 text-community-green" />;
      case 'help':
        return <Users className="h-4 w-4 text-community-blue" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-community-yellow" />;
      default:
        return null;
    }
  };

  const getPostTypeBadge = (type: string) => {
    const badges = {
      safety: { label: 'Safety Alert', variant: 'destructive' as const },
      marketplace: { label: 'For Sale', variant: 'secondary' as const },
      help: { label: 'Need Help', variant: 'outline' as const },
      event: { label: 'Community Event', variant: 'default' as const },
      general: { label: 'General', variant: 'outline' as const },
    };
    
    return badges[type as keyof typeof badges] || badges.general;
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageGalleryOpen(true);
  };

  const handleShare = () => {
    onShare(post);
    setShareDialogOpen(true);
  };

  const typeBadge = getPostTypeBadge(post.type);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 pb-3 border-b sticky top-0 bg-background z-10 relative">
            <VisuallyHidden>
              <DialogTitle>View Post by {post.author.name}</DialogTitle>
              <DialogDescription>
                Full screen view of the community post with comments and interactions
              </DialogDescription>
            </VisuallyHidden>
            <div className="flex items-start justify-between">
              {/* Close button positioned absolutely */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 z-20 p-2 rounded-full hover:bg-muted/80 transition-colors bg-background/80 backdrop-blur-sm"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity pr-12"
                onClick={() => onProfileClick(post.author.name, post.author.avatar)}
              >
                <OnlineAvatar
                  userId={post.user_id}
                  src={post.author.avatar}
                  fallback={post.author.name.split(' ').map(n => n[0]).join('')}
                  size="xl"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-lg">
                      {post.author.name}
                    </h4>
                    <Badge variant={typeBadge.variant}>
                      {getPostTypeIcon(post.type)}
                      <span className="ml-1">{typeBadge.label}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{post.author.location}</span>
                    <Clock className="h-4 w-4 ml-2" />
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-4 pt-2 overflow-y-auto flex-1">
            {post.title && (
              <h3 className="font-semibold text-xl mb-4">{post.title}</h3>
            )}
            
            <p className="text-base leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>
            
            {/* Display tags if any */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Display video if any */}
            {post.video_url && (
              <div className="mb-6 relative rounded-lg overflow-hidden cursor-pointer group" onClick={() => setVideoDialogOpen(true)}>
                <img
                  src={post.video_thumbnail_url || '/placeholder.svg'}
                  alt="Video thumbnail"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <div className="bg-background/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-foreground" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Display images if any */}
            {post.images && post.images.length > 0 && (
              <div className={`grid gap-2 mb-6 ${
                post.images.length === 1 ? 'grid-cols-1' : 
                post.images.length === 2 ? 'grid-cols-2' : 
                'grid-cols-2'
              }`}>
                {post.images.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt="Post image"
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(index)}
                  />
                ))}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex items-center justify-between py-4 border-t border-b mb-6">
              <div className="flex items-center gap-6">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onLike(post.id)}
                  className={`${post.isLiked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
                >
                  <Heart className={`h-5 w-5 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span>{post.likes} Likes</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  <span>{post.comments} Comments</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onSave(post.id)}
                  className={`${post.isSaved ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
                >
                  <Bookmark className={`h-5 w-5 ${post.isSaved ? 'fill-current' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleShare}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Comment Section */}
            {showComments && (
              <CommentSection 
                postId={post.id}
                commentCount={post.comments}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Dialog */}
      {post.images && (
        <ImageGalleryDialog
          isOpen={imageGalleryOpen}
          onClose={() => setImageGalleryOpen(false)}
          images={post.images}
          title={post.title || 'Post Images'}
          initialIndex={selectedImageIndex}
        />
      )}

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        postId={post.id}
        postTitle={post.title}
        postContent={post.content}
        postAuthor={post.author.name}
      />

      {/* Video Player Dialog */}
      {post.video_url && (
        <VideoPlayerDialog
          isOpen={videoDialogOpen}
          onClose={() => setVideoDialogOpen(false)}
          videoUrl={post.video_url}
          thumbnailUrl={post.video_thumbnail_url}
          title={post.title || 'Video'}
        />
      )}
    </>
  );
};