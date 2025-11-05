import React, { useRef, useEffect, memo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PostCard } from '../post/PostCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { FeedDialogs } from './FeedDialogs';
import { PostCardData } from '@/types/community';
import { usePostVisibility } from '@/hooks/community/usePostVisibility';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollRestoration } from '@/hooks/community/useScrollRestoration';

interface VirtualizedFeedListProps {
  events: PostCardData[];
  loading: boolean;
  onLike: (eventId: string) => void;
  onSave: (eventId: string) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onPostVisible?: (postId: string) => void;
}

const VirtualizedFeedListComponent = ({
  events,
  loading,
  onLike,
  onSave,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
  onPostVisible,
}: VirtualizedFeedListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Dialog state
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

  // Scroll restoration
  useScrollRestoration(parentRef.current, 'community-feed');

  // Estimate post height based on content
  const estimateSize = (index: number) => {
    if (index >= events.length) return 100; // Loader row
    const post = events[index];
    
    // Base height differs by device
    let height = isMobile ? 200 : 180;
    
    // Title adds height
    if (post.title) {
      const titleLines = Math.ceil((post.title?.length || 0) / (isMobile ? 30 : 50));
      height += titleLines * 28;
    }
    
    // Content adds height
    if (post.content) {
      const contentLines = Math.ceil((post.content?.length || 0) / (isMobile ? 40 : 60));
      height += Math.min(contentLines * 24, 150);
    }
    
    // Images add significant height
    if (post.image_urls && post.image_urls.length > 0) {
      if (post.image_urls.length === 1) {
        height += isMobile ? 320 : 400;
      } else if (post.image_urls.length === 2) {
        height += isMobile ? 280 : 300;
      } else {
        height += isMobile ? 350 : 450;
      }
    }
    
    // Tags, location, interactions
    if (post.tags && post.tags.length > 0) height += 36;
    if (post.location) height += 24;
    height += 60; // Interaction buttons and padding
    
    return height;
  };

  // Initialize virtualizer with window scroll
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? events.length + 1 : events.length,
    getScrollElement: () => (typeof window !== 'undefined' ? window : null) as any,
    estimateSize,
    overscan: isMobile ? 2 : 3, // Less overscan on mobile
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  // Auto-fetch next page when scrolling near bottom
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= events.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage?.();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    events.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  // Event handlers
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
      <div className="w-full">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > events.length - 1;
            const post = events[virtualRow.index];

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="px-2 sm:px-4"
              >
                {isLoaderRow ? (
                  hasNextPage ? (
                    <div className="py-4 animate-fade-in">
                      <LoadingSkeleton />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm animate-fade-in">
                      ✨ You've caught up with your community
                    </div>
                  )
                ) : (
                  <div
                    ref={observePost}
                    data-post-id={post.id}
                    className="mb-4 sm:mb-6 animate-fade-in"
                  >
                    <PostCard
                      post={post}
                      onLike={() => onLike(post.id)}
                      onSave={() => onSave(post.id)}
                      onShare={() => handleShare(post)}
                      onRSVP={() => handleRSVP(post)}
                      onAvatarClick={handleAvatarClick}
                      onImageClick={(imageIndex) => handleImageClick(post, imageIndex)}
                      onPostClick={() => handlePostClick(post)}
                      showComments={visibleComments.has(post.id)}
                      onToggleComments={() => toggleComments(post.id)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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

export const VirtualizedFeedList = memo(VirtualizedFeedListComponent);
