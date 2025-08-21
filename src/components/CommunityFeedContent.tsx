import { useState } from "react";
import { CommunityPostCard } from "./CommunityPostCard";
import ShareDialog from "./ShareDialog";
import RSVPDialog from "./RSVPDialog";
import ViewEventDialog from "./ViewEventDialog";
import { UserProfileDialog } from "./UserProfileDialog";
import { LoadingSpinner } from "./common/LoadingSpinner";

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
      <div className="space-y-6 pb-6">
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
            showComments={visibleComments.has(event.id)}
            onToggleComments={() => toggleComments(event.id)}
          />
        ))}
      </div>

      {/* Dialogs */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        postTitle={selectedEvent?.title || 'Community Post'}
        postContent={selectedEvent?.content || ''}
      />

      <RSVPDialog
        open={rsvpDialogOpen}
        onOpenChange={setRsvpDialogOpen}
        eventId={selectedEvent?.id || ''}
      />

      <ViewEventDialog
        open={viewEventDialogOpen}
        onOpenChange={setViewEventDialogOpen}
        eventId={selectedEvent?.id || ''}
      />

      <UserProfileDialog
        isOpen={userProfileDialogOpen}
        onClose={() => setUserProfileDialogOpen(false)}
        userId={selectedUserId}
      />
    </>
  );
};