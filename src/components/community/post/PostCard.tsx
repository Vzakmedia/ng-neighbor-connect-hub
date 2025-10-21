import React, { useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PostCardData } from '@/types/community';
import { PostCardHeader } from './PostCardHeader';
import { PostCardContent } from './PostCardContent';
import { PostCardMedia } from './PostCardMedia';
import { PostCardActions } from './PostCardActions';
import CommentSection from '@/components/CommentSection';

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
      
      <CardContent className="space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
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
          <div className="pt-3 border-t animate-fade-in">
            <CommentSection postId={post.id} commentCount={post.comments_count || 0} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PostCard = memo(PostCardComponent);
