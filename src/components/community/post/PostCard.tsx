import React, { useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PostCardData } from '@/types/community';
import { PostCardHeader } from './PostCardHeader';
import { PostCardContent } from './PostCardContent';
import { PostCardMedia } from './PostCardMedia';
import { PostCardActions } from './PostCardActions';
import CommentSection from '@/components/CommentSection';
import { Users, Building, Home, Globe } from 'lucide-react';

interface PostCardProps {
  post: PostCardData;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onRSVP: () => void;
  onAvatarClick: (userId: string) => void;
  onImageClick: (imageIndex: number) => void;
  onPostClick: () => void;
  showComments: boolean;
  onToggleComments: () => void;
}

const PostCardComponent = ({
  post,
  onLike,
  onSave,
  onShare,
  onRSVP,
  onAvatarClick,
  onImageClick,
  onPostClick,
  showComments,
  onToggleComments
}: PostCardProps) => {
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  // Get visibility indicator
  const getVisibilityBadge = () => {
    const locationScope = (post as any).location_scope;
    const targetNeighborhood = (post as any).target_neighborhood;
    const targetCity = (post as any).target_city;
    const targetState = (post as any).target_state;

    if (locationScope === 'neighborhood' && targetNeighborhood) {
      return (
        <Badge variant="outline" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          {targetNeighborhood}
        </Badge>
      );
    } else if (locationScope === 'city' && targetCity) {
      return (
        <Badge variant="outline" className="text-xs">
          <Building className="h-3 w-3 mr-1" />
          {targetCity}
        </Badge>
      );
    } else if (locationScope === 'state' && targetState) {
      return (
        <Badge variant="outline" className="text-xs">
          <Home className="h-3 w-3 mr-1" />
          {targetState}
        </Badge>
      );
    } else if (locationScope === 'all') {
      return (
        <Badge variant="outline" className="text-xs">
          <Globe className="h-3 w-3 mr-1" />
          Everyone
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card 
      className="w-full animate-fade-in hover:shadow-md transition-shadow cursor-pointer"
      onClick={onPostClick}
    >
      <PostCardHeader 
        author={post.author}
        createdAt={post.created_at}
        rsvpEnabled={post.rsvp_enabled}
        onAvatarClick={onAvatarClick}
      />
      
      <CardContent className="space-y-2 px-3 sm:px-4 pb-2 sm:pb-3 pt-0">
        {getVisibilityBadge() && (
          <div className="flex justify-end">
            {getVisibilityBadge()}
          </div>
        )}
        
        <PostCardContent
          title={post.title}
          content={post.content}
          location={post.location}
          tags={post.tags}
          onPostClick={onPostClick}
        />
        
        <PostCardMedia
          images={post.image_urls}
          imageError={imageError}
          onImageError={handleImageError}
          onImageClick={onImageClick}
        />
        
        <PostCardActions
          post={post}
          showComments={showComments}
          onLike={onLike}
          onSave={onSave}
          onShare={onShare}
          onRSVP={post.rsvp_enabled ? onRSVP : undefined}
          onToggleComments={onToggleComments}
        />
        
        {showComments && (
          <div className="pt-2 border-t animate-fade-in">
            <CommentSection postId={post.id} commentCount={post.comments_count || 0} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PostCard = memo(PostCardComponent);
