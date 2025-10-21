import React, { memo } from "react";
import { FeedList } from "./community/feed/FeedList";
import { transformToCardData } from "@/lib/community/postTransformers";

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
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onPostVisible?: (postId: string) => void;
}

// Memoize component to prevent unnecessary re-renders
const CommunityFeedContentComponent = ({ 
  events, 
  loading, 
  onLike, 
  onSave,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
  onPostVisible,
}: CommunityFeedContentProps) => {
  // Transform events to PostCardData format
  const transformedEvents = events.map(event => transformToCardData(event as any));

  return (
    <FeedList
      events={transformedEvents}
      loading={loading}
      onLike={onLike}
      onSave={onSave}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onPostVisible={onPostVisible}
    />
  );
};

// Export memoized version for better performance
export const CommunityFeedContent = memo(CommunityFeedContentComponent);

export default CommunityFeedContent;