import React from 'react';
import ShareDialog from '@/components/ShareDialog';
import RSVPDialog from '@/components/RSVPDialog';
import ViewEventDialog from '@/components/ViewEventDialog';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { ImageGalleryDialog } from '@/components/ImageGalleryDialog';
import { PostFullScreenDialog } from '@/components/PostFullScreenDialog';
import { PostCardData } from '@/types/community';

interface FeedDialogsProps {
  shareDialogOpen: boolean;
  setShareDialogOpen: (open: boolean) => void;
  rsvpDialogOpen: boolean;
  setRsvpDialogOpen: (open: boolean) => void;
  viewEventDialogOpen: boolean;
  setViewEventDialogOpen: (open: boolean) => void;
  userProfileDialogOpen: boolean;
  setUserProfileDialogOpen: (open: boolean) => void;
  imageGalleryOpen: boolean;
  setImageGalleryOpen: (open: boolean) => void;
  postFullScreenOpen: boolean;
  setPostFullScreenOpen: (open: boolean) => void;
  selectedEvent: PostCardData | null;
  selectedUserId: string;
  selectedImageIndex: number;
  onLike: (eventId: string) => void;
  onSave: (eventId: string) => void;
  handleShare: (event: PostCardData) => void;
  handleAvatarClick: (userId: string) => void;
}

export const FeedDialogs = ({
  shareDialogOpen,
  setShareDialogOpen,
  rsvpDialogOpen,
  setRsvpDialogOpen,
  viewEventDialogOpen,
  setViewEventDialogOpen,
  userProfileDialogOpen,
  setUserProfileDialogOpen,
  imageGalleryOpen,
  setImageGalleryOpen,
  postFullScreenOpen,
  setPostFullScreenOpen,
  selectedEvent,
  selectedUserId,
  selectedImageIndex,
  onLike,
  onSave,
  handleShare,
  handleAvatarClick,
}: FeedDialogsProps) => {
  return (
    <>
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        postId={selectedEvent?.id || ''}
        postTitle={selectedEvent?.title || undefined}
        postContent={selectedEvent?.content || ''}
        postAuthor={selectedEvent?.author?.full_name || 'Anonymous'}
      />

      <RSVPDialog
        open={rsvpDialogOpen}
        onOpenChange={setRsvpDialogOpen}
        eventId={selectedEvent?.id || ''}
        eventTitle={selectedEvent?.title || 'Community Event'}
      />

      <ViewEventDialog
        open={viewEventDialogOpen}
        onOpenChange={setViewEventDialogOpen}
        event={selectedEvent as any}
      />

      <UserProfileDialog
        isOpen={userProfileDialogOpen}
        onClose={() => setUserProfileDialogOpen(false)}
        userName={selectedUserId}
      />

      <ImageGalleryDialog
        isOpen={imageGalleryOpen}
        onClose={() => setImageGalleryOpen(false)}
        images={selectedEvent?.image_urls || []}
        title={selectedEvent?.title || 'Post Images'}
        initialIndex={selectedImageIndex}
      />

      <PostFullScreenDialog
        isOpen={postFullScreenOpen}
        onClose={() => setPostFullScreenOpen(false)}
        post={selectedEvent ? {
          id: selectedEvent.id,
          user_id: selectedEvent.user_id,
          author: {
            name: selectedEvent.author?.full_name || 'Anonymous',
            avatar: selectedEvent.author?.avatar_url,
            location: selectedEvent.location || 'Unknown location'
          },
          content: selectedEvent.content,
          title: selectedEvent.title || undefined,
          type: selectedEvent.rsvp_enabled ? 'event' : 'general',
          timestamp: new Date(selectedEvent.created_at).toLocaleDateString(),
          likes: selectedEvent.likes_count || 0,
          comments: selectedEvent.comments_count || 0,
          images: selectedEvent.image_urls,
          video_url: selectedEvent.video_url,
          video_thumbnail_url: selectedEvent.video_thumbnail_url,
          tags: selectedEvent.tags,
          isLiked: selectedEvent.isLiked || false,
          isSaved: selectedEvent.isSaved || false
        } : null}
        onLike={onLike}
        onSave={onSave}
        onShare={(post) => {
          const event = selectedEvent;
          if (event) handleShare(event);
        }}
        onProfileClick={(name) => {
          if (selectedEvent) handleAvatarClick(selectedEvent.author?.user_id || selectedEvent.user_id);
        }}
      />
    </>
  );
};
