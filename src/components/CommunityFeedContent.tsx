import { useState } from "react";
import { CommunityPostCard } from "./CommunityPostCard";
import ShareDialog from "./ShareDialog";
import RSVPDialog from "./RSVPDialog";
import ViewEventDialog from "./ViewEventDialog";
import { UserProfileDialog } from "./UserProfileDialog";
import { LoadingSpinner } from "./common/LoadingSpinner";
import { ImageGalleryDialog } from "./ImageGalleryDialog";
import { PostFullScreenDialog } from "./PostFullScreenDialog";

interface Event {
  id: string;
  user_id: string;
  content: string;
  title?: string;
  image_urls?: string[];
  tags?: string[];
  location?: string;
  rsvp_enabled?: boolean;
  created_at: string;
  author?: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
  };
  likes_count?: number;
  comments_count?: number;
  saves_count?: number;
  views_count?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

interface CommunityFeedContentProps {
  events: Event[];
  loading: boolean;
  onLike: (eventId: string) => void;
  onSave: (eventId: string) => void;
}

export const CommunityFeedContent = ({
  events,
  loading,
  onLike,
  onSave
}: CommunityFeedContentProps) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [viewEventDialogOpen, setViewEventDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [visibleComments, setVisibleComments] = useState<Set<string>>(new Set());
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [postFullScreenOpen, setPostFullScreenOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleShare = (event: Event) => {
    setSelectedEvent(event);
    setShareDialogOpen(true);
  };

  const handleRSVP = (event: Event) => {
    setSelectedEvent(event);
    setRsvpDialogOpen(true);
  };

  const handleViewEvent = (event: Event) => {
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

  const handleImageClick = (event: Event, imageIndex: number = 0) => {
    setSelectedEvent(event);
    setSelectedImageIndex(imageIndex);
    setImageGalleryOpen(true);
  };

  const handlePostClick = (event: Event) => {
    setSelectedEvent(event);
    setPostFullScreenOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
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
      <div className="space-y-4 sm:space-y-6 pb-6">{/* Mobile responsive spacing */}
        {events.map((event) => (
          <CommunityPostCard
            key={event.id}
            event={event}
            onLike={onLike}
            onSave={onSave}
            onShare={handleShare}
            onRSVP={handleRSVP}
            onViewEvent={handleViewEvent}
            onAvatarClick={handleAvatarClick}
            onImageClick={handleImageClick}
            onPostClick={handlePostClick}
            showComments={visibleComments.has(event.id)}
            onToggleComments={() => toggleComments(event.id)}
          />
        ))}
      </div>

      {/* Dialogs */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        postId={selectedEvent?.id || ''}
        postTitle={selectedEvent?.title}
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

      {/* Image Gallery Dialog */}
      <ImageGalleryDialog
        isOpen={imageGalleryOpen}
        onClose={() => setImageGalleryOpen(false)}
        images={selectedEvent?.image_urls || []}
        title={selectedEvent?.title || 'Post Images'}
        initialIndex={selectedImageIndex}
      />

      {/* Post Full Screen Dialog */}
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
          title: selectedEvent.title,
          type: selectedEvent.rsvp_enabled ? 'event' : 'general',
          timestamp: new Date(selectedEvent.created_at).toLocaleDateString(),
          likes: selectedEvent.likes_count || 0,
          comments: selectedEvent.comments_count || 0,
          images: selectedEvent.image_urls,
          tags: selectedEvent.tags,
          isLiked: selectedEvent.isLiked || false,
          isSaved: selectedEvent.isSaved || false
        } : null}
        onLike={onLike}
        onSave={onSave}
        onShare={(post) => {
          const event = events.find(e => e.id === post.id);
          if (event) handleShare(event);
        }}
        onProfileClick={(name) => {
          const event = events.find(e => e.author?.full_name === name);
          if (event) handleAvatarClick(event.author?.user_id || event.user_id);
        }}
      />
    </>
  );
};