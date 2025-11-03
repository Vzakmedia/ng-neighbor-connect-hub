import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useReadStatus } from "@/hooks/useReadStatus";

export const CommunityFeed = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { preferences } = useLocationPreferences();
  const { markCommunityPostAsRead, refreshUnreadCounts, markAllCommunityPostsAsRead } = useReadStatus();
  const isMobile = useIsMobile();
  const [markedPostIds, setMarkedPostIds] = useState<Set<string>>(new Set());
  const pendingMarksRef = useRef<Set<string>>(new Set());
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    locationScope: (preferences?.default_location_filter || (profile?.city ? 'city' : 'all')) as string,
    tags: [] as string[],
    postTypes: 'all' as string,
    sortBy: 'newest' as string,
    dateRange: 'all' as string,
  });
  const [unreadCounts, setUnreadCounts] = useState({ community: 0 });

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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
    searchQuery: debouncedSearchQuery, // Use debounced search
  });

  // Mutations
  const likePost = useLikePost();
  const savePost = useSavePost();

  // Flatten paginated data and transform to match component expectations
  const events = useMemo(() => 
    data?.pages.flatMap(page => page.items.map(item => ({
      ...item,
      author: {
        user_id: item.user_id,
        full_name: item.author_name,
        avatar_url: item.author_avatar,
      },
      likes_count: item.like_count,
      comments_count: item.comment_count,
      saves_count: item.save_count,
      isLiked: item.is_liked,
      isSaved: item.is_saved,
    }))) ?? [],
    [data]
  );

  // Batch mark-as-read operations and optimistically update count
  const batchedMarkAsRead = useCallback(() => {
    const pendingPosts = Array.from(pendingMarksRef.current);
    if (pendingPosts.length === 0) return;

    // Optimistically decrease unread count immediately
    setUnreadCounts(prev => ({ 
      ...prev, 
      community: Math.max(0, prev.community - pendingPosts.length) 
    }));

    // Mark all pending posts as read in parallel
    Promise.all(pendingPosts.map(postId => markCommunityPostAsRead(postId)))
      .then(() => {
        // Add to marked set
        setMarkedPostIds(prev => {
          const newSet = new Set(prev);
          pendingPosts.forEach(id => newSet.add(id));
          return newSet;
        });
        // Clear pending
        pendingMarksRef.current.clear();
      })
      .catch(() => {
        // Revert optimistic update on error
        refreshUnreadCounts();
        pendingMarksRef.current.clear();
      });
  }, [markCommunityPostAsRead, refreshUnreadCounts]);

  // Debounced batch processing - increased to 2000ms for better batching
  const debouncedBatchMarkRead = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      batchedMarkAsRead();
    }, 2000); // Batch for 2 seconds
  }, [batchedMarkAsRead]);

  // Mark a post as read when it's been visible for 2+ seconds
  const handlePostVisible = useCallback((postId: string) => {
    if (markedPostIds.has(postId) || pendingMarksRef.current.has(postId)) {
      return; // Already marked or pending
    }

    // Add to pending batch
    pendingMarksRef.current.add(postId);
    
    // Trigger batched update
    debouncedBatchMarkRead();
  }, [markedPostIds, debouncedBatchMarkRead]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

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
        onMarkAllRead={markAllCommunityPostsAsRead}
        userLocation={{
          state: profile?.state,
          city: profile?.city,
          neighborhood: profile?.neighborhood
        }}
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
          onPostVisible={handlePostVisible}
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