import React, { useState, useMemo } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { CommunityFeedHeader } from "./CommunityFeedHeader";
import { CommunityFeedContent } from "./CommunityFeedContent";
import { NewPostsBanner } from "./NewPostsBanner";
import { useFeedQuery, useLikePost, useSavePost } from "@/hooks/useFeedQuery";
import { useCommunitySubscriptions } from "@/hooks/useCommunitySubscriptions";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLocationPreferences } from "@/hooks/useLocationPreferences";
import { useIsMobile } from "@/hooks/use-mobile";

export const CommunityFeed = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { preferences } = useLocationPreferences();
  const isMobile = useIsMobile();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    locationScope: 'neighborhood' as string,
    tags: [] as string[],
    postTypes: 'all' as string,
    sortBy: 'newest' as string,
    dateRange: 'all' as string,
  });
  const [unreadCounts, setUnreadCounts] = useState({ community: 0 });

  // Use React Query for feed data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isFetching,
  } = useFeedQuery({
    locationScope: filters.locationScope as 'neighborhood' | 'city' | 'state' | 'all',
    tags: filters.tags,
    sortBy: 'recent' as 'recent' | 'popular',
    searchQuery,
  });

  // Mutations
  const likePost = useLikePost();
  const savePost = useSavePost();

  // Flatten paginated data
  const events = useMemo(() => 
    data?.pages.flatMap(page => page.items) ?? [],
    [data]
  );

  // Extract available tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    events.forEach(event => {
      event.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  }, [events]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length;
    if (filters.postTypes && filters.postTypes !== 'all') count += 1;
    if (filters.dateRange) count += 1;
    return count;
  }, [filters]);

  // Handle like - find current state from events
  const handleLike = async (postId: string) => {
    const post = events.find(e => e.id === postId);
    if (post) {
      likePost.mutate({ postId, isLiked: post.is_liked });
    }
  };

  // Handle save - find current state from events
  const handleSave = async (postId: string) => {
    const post = events.find(e => e.id === postId);
    if (post) {
      savePost.mutate({ postId, isSaved: post.is_saved });
    }
  };

  // Handle refresh for pull-to-refresh
  const handlePullRefresh = async () => {
    await refetch();
  };

  // Set up real-time subscriptions
  useCommunitySubscriptions({
    user,
    profile,
    currentLocationFilter: filters.locationScope,
    onNewContent: () => {}, // Handled by NewPostsBanner
    onUpdateUnreadCounts: setUnreadCounts,
    onRefreshPosts: () => refetch(),
    onUpdatePostLikes: () => {},
    onUpdatePostComments: () => {},
  });

  const feedContent = (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      <NewPostsBanner />
      
      <CommunityFeedHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hasNewContent={false}
        onRefresh={refetch}
        refreshing={isFetching && !isFetchingNextPage}
        unreadCount={unreadCounts.community}
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
        activeFiltersCount={activeFiltersCount}
      />
      
      <div className="p-2 sm:p-4">
        <CommunityFeedContent
          events={events}
          loading={isLoading}
          onLike={handleLike}
          onSave={handleSave}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      </div>
    </div>
  );

  // Wrap with pull-to-refresh on mobile
  if (isMobile) {
    return (
      <PullToRefresh
        onRefresh={handlePullRefresh}
        pullingContent={
          <div className="text-center py-4 text-muted-foreground text-sm">
            Pull down to refresh...
          </div>
        }
        refreshingContent={
          <div className="text-center py-4 text-primary text-sm animate-pulse">
            Refreshing...
          </div>
        }
        className="min-h-screen"
      >
        {feedContent}
      </PullToRefresh>
    );
  }

  return feedContent;
};

export default CommunityFeed;