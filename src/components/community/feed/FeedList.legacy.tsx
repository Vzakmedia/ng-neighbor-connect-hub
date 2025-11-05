import React, { useState, memo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PostCard } from '../post/PostCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { FeedDialogs } from './FeedDialogs';
import { PostCardData } from '@/types/community';
import { usePostVisibility } from '@/hooks/community/usePostVisibility';

interface FeedListProps {
  events: PostCardData[];
  loading: boolean;
  onLike: (eventId: string) => void;
  onSave: (eventId: string) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onPostVisible?: (postId: string) => void;
}

const FeedListComponent = ({
  events,
  loading,
  onLike,
  onSave,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
  onPostVisible,
}: FeedListProps) => {
  const [selectedEvent, setSelectedEvent] = useState<PostCardData | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [viewEventDialogOpen, setViewEventDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [visibleComments, setVisibleComments] = useState<Set<string>>(new Set());
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [postFullScreenOpen, setPostFullScreenOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { observePost } = usePostVisibility((postId) => {
    if (onPostVisible) {
      onPostVisible(postId);
    }
  });

  const handleShare = (event: PostCardData) => {
    setSelectedEvent(event);
    setShareDialogOpen(true);
  };

  const handleRSVP = (event: PostCardData) => {
    setSelectedEvent(event);
    setRsvpDialogOpen(true);
  };

  const handleViewEvent = (event: PostCardData) => {
    setSelectedEvent(event);
    setViewEventDialogOpen(true);
  };

  const handleAvatarClick = (userId: string) => {
    setSelectedUserId(userId);
    setUserProfileDialogOpen(true);
  };

  const toggleComments = (eventId: string) => {
    setVisibleComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleImageClick = (event: PostCardData, imageIndex: number = 0) => {
    setSelectedEvent(event);
    setSelectedImageIndex(imageIndex);
    setImageGalleryOpen(true);
  };

  const handlePostClick = (event: PostCardData) => {
    setSelectedEvent(event);
    setPostFullScreenOpen(true);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No posts found in your area.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Be the first to share something with your community!
        </p>
      </div>
    );
  }

  return (
    <>
      <InfiniteScroll
        dataLength={events.length}
        next={() => fetchNextPage?.()}
        hasMore={hasNextPage || false}
        loader={
          <div className="py-4 animate-fade-in">
            <LoadingSkeleton />
          </div>
        }
        scrollThreshold={0.8}
        endMessage={
          <div className="text-center py-8 text-muted-foreground text-sm animate-fade-in">
            {events.length > 0 ? "✨ You've caught up with your community" : ""}
          </div>
        }
      >
        <div className="space-y-4 sm:space-y-6 pb-6">
          {events.map((event, index) => (
            <div
              key={event.id}
              ref={observePost}
              data-post-id={event.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PostCard
                post={event}
                onLike={() => onLike(event.id)}
                onSave={() => onSave(event.id)}
                onShare={() => handleShare(event)}
                onRSVP={() => handleRSVP(event)}
                onAvatarClick={handleAvatarClick}
                onImageClick={(imageIndex) => handleImageClick(event, imageIndex)}
                onPostClick={() => handlePostClick(event)}
                showComments={visibleComments.has(event.id)}
                onToggleComments={() => toggleComments(event.id)}
              />
            </div>
          ))}
        </div>
      </InfiniteScroll>

      <FeedDialogs
        shareDialogOpen={shareDialogOpen}
        setShareDialogOpen={setShareDialogOpen}
        rsvpDialogOpen={rsvpDialogOpen}
        setRsvpDialogOpen={setRsvpDialogOpen}
        viewEventDialogOpen={viewEventDialogOpen}
        setViewEventDialogOpen={setViewEventDialogOpen}
        userProfileDialogOpen={userProfileDialogOpen}
        setUserProfileDialogOpen={setUserProfileDialogOpen}
        imageGalleryOpen={imageGalleryOpen}
        setImageGalleryOpen={setImageGalleryOpen}
        postFullScreenOpen={postFullScreenOpen}
        setPostFullScreenOpen={setPostFullScreenOpen}
        selectedEvent={selectedEvent}
        selectedUserId={selectedUserId}
        selectedImageIndex={selectedImageIndex}
        onLike={onLike}
        onSave={onSave}
        handleShare={handleShare}
        handleAvatarClick={handleAvatarClick}
      />
    </>
  );
};

export const FeedList = memo(FeedListComponent);
