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
import { useNativeNetwork } from "@/hooks/mobile/useNativeNetwork";
import { Capacitor } from "@capacitor/core";
import { useQueryClient } from "@tanstack/react-query";

export interface CommunityFeedProps {
  filters?: {
    locationScope: string;
    tags: string[];
    postTypes: string;
    sortBy: string;
    dateRange: string;
  };
  onFiltersChange?: (filters: any) => void;
}

export const CommunityFeed = ({ 
  filters: externalFilters,
  onFiltersChange: externalOnFiltersChange 
}: CommunityFeedProps = {}) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { preferences } = useLocationPreferences();
  const queryClient = useQueryClient();
  const { markCommunityPostAsRead, refreshUnreadCounts, markAllCommunityPostsAsRead } = useReadStatus();
  const isMobile = useIsMobile();
  const { connectionType } = useNativeNetwork();
  const isNative = Capacitor.isNativePlatform();
  const [markedPostIds, setMarkedPostIds] = useState<Set<string>>(new Set());
  const pendingMarksRef = useRef<Set<string>>(new Set());
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Adjust polling interval based on connection type
  const pollingInterval = useMemo(() => {
    if (!isNative) return 60000; // 1 minute on web
    if (connectionType === 'wifi') return 30000; // 30 seconds on WiFi
    if (connectionType === 'cellular') return 120000; // 2 minutes on cellular
    return 300000; // 5 minutes on slow/unknown connections
  }, [isNative, connectionType]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [internalFilters, setInternalFilters] = useState({
    locationScope: (preferences?.default_location_filter || (profile?.city ? 'city' : 'all')) as string,
    tags: [] as string[],
    postTypes: 'all' as string,
    sortBy: 'newest' as string,
    dateRange: 'all' as string,
  });
  
  // Use external filters if provided, otherwise internal
  const filters = externalFilters || internalFilters;
  const setFilters = externalOnFiltersChange || setInternalFilters;
  const [unreadCounts, setUnreadCounts] = useState({ community: 0 });

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Map CommunityFilters to FeedFilters format for useFeedQuery
  const feedQueryFilters = useMemo(() => ({
    locationScope: filters.locationScope as 'neighborhood' | 'city' | 'state' | 'all',
    tags: filters.tags,
    postType: filters.postTypes !== 'all' ? filters.postTypes : undefined,
    sortBy: (() => {
      if (filters.sortBy === 'newest' || filters.sortBy === 'recent') return 'recent';
      if (filters.sortBy === 'popular' || filters.sortBy === 'trending') return 'popular';
      if (filters.sortBy === 'recommended') return 'recommended';
      return 'recent'; // default
    })() as 'recent' | 'popular' | 'recommended',
    searchQuery: debouncedSearchQuery,
  }), [filters.locationScope, filters.tags, filters.postTypes, filters.sortBy, debouncedSearchQuery]);

  // Use React Query for feed data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isFetching,
    isPlaceholderData, // NEW: Track if showing stale cached data
  } = useFeedQuery(feedQueryFilters);

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

  // Debounced batch processing - adjust based on connection
  const batchDelay = useMemo(() => {
    if (connectionType === 'cellular') return 5000; // 5s on cellular
    return 2000; // 2s on WiFi/web
  }, [connectionType]);

  const debouncedBatchMarkRead = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      batchedMarkAsRead();
    }, batchDelay);
  }, [batchedMarkAsRead, batchDelay]);

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
    // Invalidate cache to force fresh fetch
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
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

  // Fallback polling to ensure fresh data even if real-time fails
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refetch if tab is visible and not already fetching
      if (document.visibilityState === 'visible' && !isFetching) {
        refetch();
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [refetch, isFetching, pollingInterval]);

  const feedContent = (
    <div className="max-w-2xl mx-auto">
      <div className="px-2 sm:px-4">
        <NewPostsBanner />

        {/* Stale data indicator - show when displaying cached data while fetching fresh */}
        {isFetching && !isLoading && isPlaceholderData && (
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b border-blue-200 dark:border-blue-800 px-4 py-2 text-sm flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">Updating feed...</span>
            </div>
            <span className="text-blue-600 dark:text-blue-400 text-xs">Showing cached content</span>
          </div>
        )}
      </div>
    
      {/* Feed content scrolls with the page */}
      <div>
        <CommunityFeedContent
          events={events}
          loading={isLoading}
          onLike={handleLike}
          onSave={handleSave}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onPostVisible={handlePostVisible}
          showAds={isMobile}
          adInterval={5}
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