import React, { useState, memo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PostCardData } from '@/types/community';
import { PostCardHeader } from './PostCardHeader';
import { PostCardContent } from './PostCardContent';
import { PostCardMedia } from './PostCardMedia';
import { PostCardActions } from './PostCardActions';
import CommentSection from '@/components/CommentSection';
import { PollCard } from '../poll/PollCard';
import { usePoll } from '@/hooks/usePoll';
import { Users, Building, Home as HomeIcon, Globe } from '@/lib/icons';
import { VideoPlayerDialog } from '@/components/VideoPlayerDialog';
import { useAuth } from '@/hooks/useAuth';

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
  onEdit?: () => void;
  onDelete?: () => void;
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
  onToggleComments,
  onEdit,
  onDelete
}: PostCardProps) => {
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const { poll, options, userVotes, isLoading } = usePoll(post.id);
  const { user } = useAuth();

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  const handleDoubleTapLike = useCallback(() => {
    // Only trigger like if not already liked
    if (!post.isLiked) {
      onLike();
    }
  }, [post.isLiked, onLike]);

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
          <HomeIcon className="h-3 w-3 mr-1" />
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
      className="w-full max-w-full animate-fade-in hover:shadow-md transition-shadow cursor-pointer rounded-xl overflow-hidden"
      onClick={onPostClick}
    >
      <PostCardHeader
        author={post.author}
        createdAt={post.created_at}
        rsvpEnabled={post.rsvp_enabled}
        locationScope={(post as any).location_scope}
        targetNeighborhood={(post as any).target_neighborhood}
        targetCity={(post as any).target_city}
        targetState={(post as any).target_state}
        onAvatarClick={onAvatarClick}
        currentUserId={user?.id}
        postUserId={post.user_id}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      
      <div className="px-3 sm:px-4 pb-3 space-y-3">
        <PostCardContent
          title={post.title}
          content={post.content}
          location={post.location}
          tags={post.tags}
          onPostClick={onPostClick}
        />
        
        {/* Poll Card */}
        {post.post_type === 'poll' && poll && !isLoading && (
          <PollCard
            pollId={poll.id}
            question={poll.question}
            closesAt={poll.closes_at}
            allowMultipleChoices={poll.allow_multiple_choices}
            maxChoices={poll.max_choices}
            options={options}
            userVotes={userVotes}
          />
        )}
      </div>
      
      {((post.image_urls && post.image_urls.length > 0) || post.video_url) && (
        <PostCardMedia
          images={post.image_urls}
          videoUrl={post.video_url}
          videoThumbnail={post.video_thumbnail_url}
          imageError={imageError}
          onImageError={handleImageError}
          onImageClick={onImageClick}
          onDoubleTapLike={handleDoubleTapLike}
          onVideoClick={() => setIsVideoDialogOpen(true)}
        />
      )}

      {post.video_url && (
        <VideoPlayerDialog
          isOpen={isVideoDialogOpen}
          onClose={() => setIsVideoDialogOpen(false)}
          videoUrl={post.video_url}
          thumbnailUrl={post.video_thumbnail_url}
          title={post.title || undefined}
        />
      )}
      
      <div className="px-3 sm:px-4 bg-primary text-white [&_*]:text-white [&_button]:text-white [&_svg]:text-white">
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
          <div className="pt-2 pb-4 border-t border-white/20 animate-fade-in">
            <CommentSection postId={post.id} commentCount={post.comments_count || 0} />
          </div>
        )}
      </div>
    </Card>
  );
};

export const PostCard = memo(PostCardComponent);
