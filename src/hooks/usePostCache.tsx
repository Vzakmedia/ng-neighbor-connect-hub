/**
 * @deprecated This hook is deprecated as React Query now handles all caching.
 * 
 * The manual post cache has been replaced by React Query's built-in caching:
 * - Automatic cache invalidation
 * - Persistent cache to localStorage
 * - Cross-tab synchronization
 * - Better memory management
 * 
 * No migration needed - React Query handles everything automatically.
 * 
 * See: docs/FEED_PERFORMANCE.md
 */

import { useEffect } from 'react';
import { postCache } from '@/services/postCache';
import { useProfile } from '@/hooks/useProfile';

export const usePostCache = (viewScope: 'neighborhood' | 'city' | 'state') => {
  const { profile } = useProfile();

  // Invalidate cache when user interacts with posts
  const invalidateCache = () => {
    if (profile) {
      postCache.invalidateLocation({
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state
      }, viewScope);
    }
  };

  // Mark activity for better cache management
  const markActivity = () => {
    if (profile) {
      postCache.markActivity({
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state
      }, viewScope);
    }
  };

  return {
    invalidateCache,
    markActivity,
    getCacheStats: () => postCache.getStats()
  };
};