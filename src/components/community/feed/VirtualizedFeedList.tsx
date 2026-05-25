import React, { useRef, useEffect, useLayoutEffect, memo, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { PostCard } from '../post/PostCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { FeedDialogs } from './FeedDialogs';
import { PostCardData } from '@/types/community';
import { usePostVisibility } from '@/hooks/community/usePostVisibility';
import { usePostViews } from '@/hooks/usePostViews';
import { AdDisplay } from '@/components/advertising/display/AdDisplay';
import { EditPostDialog } from '../EditPostDialog';
import { useDeletePost } from '@/hooks/useFeedQuery';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VirtualizedFeedListProps {
  events: PostCardData[];
  loading: boolean;
  onLike: (eventId: string) => void;
  onSave: (eventId: string) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onPostVisible?: (postId: string) => void;
  showAds?: boolean;
  adInterval?: number;
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
  showAds = false,
  adInterval = 5,
}: VirtualizedFeedListProps) => {
  const { trackPostView } = usePostViews();
  const { toast } = useToast();
  const deletePost = useDeletePost();
  // Dialog state
  const [selectedEvent, setSelectedEvent] = useState<PostCardData | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [viewEventDialogOpen, setViewEventDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string | undefined>();
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>();
  const [visibleComments, setVisibleComments] = useState<Set<string>>(new Set());
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [postFullScreenOpen, setPostFullScreenOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostCardData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<PostCardData | null>(null);

  const { observePost } = usePostVisibility((postId) => {
    trackPostView(postId);
    if (onPostVisible) {
      onPostVisible(postId);
    }
  });

  // Mix ads into events array — must be declared before the virtualizer that reads it
  const mixedContent = React.useMemo(() => {
    if (!showAds) return events.map(event => ({ type: 'post' as const, data: event }));

    const mixed: Array<{ type: 'post' | 'ad'; data?: PostCardData; adIndex?: number }> = [];
    events.forEach((event, index) => {
      mixed.push({ type: 'post', data: event });
      if ((index + 1) % adInterval === 0 && index < events.length - 1) {
        mixed.push({ type: 'ad', adIndex: Math.floor(index / adInterval) });
      }
    });
    return mixed;
  }, [events, showAds, adInterval]);

  // Virtual list setup
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    if (listRef.current) {
      setScrollMargin(listRef.current.getBoundingClientRect().top + window.scrollY);
    }
  }, []);

  // +1 for the footer row (loading indicator / end message)
  const totalCount = mixedContent.length + 1;

  const rowVirtualizer = useWindowVirtualizer({
    count: totalCount,
    estimateSize: (index) => {
      if (index >= mixedContent.length) return 80;
      const item = mixedContent[index];
      if (item.type === 'ad') return 220;
      return (item.data?.image_urls?.length ?? 0) > 0 ? 540 : 320;
    },
    overscan: 4,
    scrollMargin,
  });

  // Trigger next page when virtual items approach the end
  const virtualItems = rowVirtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= mixedContent.length - 2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.();
    }
  }, [virtualItems, mixedContent.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const handleAvatarClick = (userId: string, userName?: string, userAvatar?: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSelectedUserAvatar(userAvatar);
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

  const handleEdit = (post: PostCardData) => {
    setEditingPost(post);
    setEditDialogOpen(true);
  };

  const handleDelete = (post: PostCardData) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deletePost.mutateAsync(postToDelete.id);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (events.length === 0 && !showAds) {
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
      <div
        ref={listRef}
        style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}
      >
        {virtualItems.map((virtualItem) => {
          const isFooter = virtualItem.index >= mixedContent.length;

          if (isFooter) {
            return (
              <div
                key="footer"
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin}px)`,
                }}
                className="py-4"
              >
                {isFetchingNextPage && <LoadingSkeleton />}
                {!hasNextPage && events.length > 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    ✨ You've caught up with your community
                  </div>
                )}
              </div>
            );
          }

          const item = mixedContent[virtualItem.index];

          if (item.type === 'ad') {
            return (
              <div
                key={`ad-${item.adIndex}`}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin}px)`,
                  paddingBottom: '12px',
                }}
              >
                <AdDisplay placement="feed" maxAds={1} />
              </div>
            );
          }

          const post = item.data!;
          return (
            <div
              key={post.id}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin}px)`,
                paddingBottom: '12px',
              }}
            >
              {/* Inner div carries data-post-id for the visibility observer */}
              <div ref={observePost} data-post-id={post.id}>
                <PostCard
                  post={post}
                  onLike={() => onLike(post.id)}
                  onSave={() => onSave(post.id)}
                  onShare={() => handleShare(post)}
                  onRSVP={() => handleRSVP(post)}
                  onAvatarClick={(userId) => handleAvatarClick(userId, post.author.full_name, post.author.avatar_url)}
                  onImageClick={(imageIndex) => handleImageClick(post, imageIndex)}
                  onPostClick={() => handlePostClick(post)}
                  showComments={visibleComments.has(post.id)}
                  onToggleComments={() => toggleComments(post.id)}
                  onEdit={() => handleEdit(post)}
                  onDelete={() => handleDelete(post)}
                />
              </div>
            </div>
          );
        })}
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
        selectedUserName={selectedUserName}
        selectedUserAvatar={selectedUserAvatar}
        selectedImageIndex={selectedImageIndex}
        onLike={onLike}
        onSave={onSave}
        handleShare={handleShare}
        handleAvatarClick={handleAvatarClick}
      />

      {editingPost && (
        <EditPostDialog
          post={editingPost}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const VirtualizedFeedList = memo(VirtualizedFeedListComponent);
