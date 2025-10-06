import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface FeedFilters {
  locationScope: 'neighborhood' | 'city' | 'state' | 'all';
  tags?: string[];
  postType?: string;
  sortBy?: 'recent' | 'popular';
  searchQuery?: string;
}

/**
 * Prefetch next page when user scrolls to 80% of current page
 * This creates a seamless infinite scroll experience
 */
export function useFeedPrefetch(
  filters: FeedFilters,
  hasNextPage: boolean | undefined,
  nextCursor: number | null | undefined
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (!hasNextPage || !nextCursor || !user || !profile) return;

    // Prefetch the next page in the background
    const queryKey = ['feed', {
      userId: user.id,
      locationScope: filters.locationScope,
      tags: filters.tags || [],
      postType: filters.postType,
      sortBy: filters.sortBy || 'recent',
      searchQuery: filters.searchQuery || '',
    }];

    // Only prefetch if not already fetching
    const queryState = queryClient.getQueryState(queryKey);
    if (!queryState?.fetchStatus || queryState.fetchStatus !== 'fetching') {
      queryClient.prefetchInfiniteQuery({
        queryKey,
        initialPageParam: nextCursor,
      });
    }
  }, [hasNextPage, nextCursor, filters, user, profile, queryClient]);
}
