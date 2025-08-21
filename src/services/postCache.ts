/**
 * Community Posts Caching Service
 * 
 * Provides intelligent caching for community posts by location to reduce database queries.
 * Uses in-memory and localStorage caching with automatic invalidation strategies.
 */

interface CachedPost {
  id: string;
  user_id: string;
  content: string;
  title?: string;
  type: 'general' | 'safety' | 'marketplace' | 'help' | 'event';
  timestamp: string;
  likes: number;
  comments: number;
  images?: string[];
  tags?: string[];
  isLiked: boolean;
  isSaved: boolean;
  author: {
    name: string;
    avatar?: string;
    location: string;
  };
  location_scope?: string;
  target_neighborhood?: string;
  target_city?: string;
  target_state?: string;
}

interface CacheEntry {
  posts: CachedPost[];
  timestamp: number;
  lastActivity: number;
  userLocation: {
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  viewScope: 'neighborhood' | 'city' | 'state';
}

interface CacheStats {
  hits: number;
  misses: number;
  refreshes: number;
  lastRefresh: number;
}

class PostCacheService {
  private cache = new Map<string, CacheEntry>();
  private refreshTimers = new Map<string, NodeJS.Timeout>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    refreshes: 0,
    lastRefresh: 0
  };

  // Cache configuration
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly HOT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for high-activity areas
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of location caches
  private readonly STORAGE_KEY = 'community_posts_cache';
  private readonly STATS_KEY = 'cache_stats';

  constructor() {
    this.loadFromStorage();
    this.startPeriodicCleanup();
  }

  /**
   * Generate cache key based on user location and view scope
   */
  private getCacheKey(userLocation: { neighborhood?: string; city?: string; state?: string }, viewScope: 'neighborhood' | 'city' | 'state'): string {
    const { neighborhood, city, state } = userLocation;
    
    switch (viewScope) {
      case 'neighborhood':
        return `${state}:${city}:${neighborhood}:neighborhood`;
      case 'city':
        return `${state}:${city}:city`;
      case 'state':
        return `${state}:state`;
      default:
        return `global:all`;
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValidCache(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Use hot cache TTL for recently active areas
    const isHotArea = (now - entry.lastActivity) < 10 * 60 * 1000; // 10 minutes
    const ttl = isHotArea ? this.HOT_CACHE_TTL : this.CACHE_TTL;
    
    return age < ttl;
  }

  /**
   * Get posts from cache if available and valid
   */
  getCachedPosts(
    userLocation: { neighborhood?: string; city?: string; state?: string },
    viewScope: 'neighborhood' | 'city' | 'state'
  ): CachedPost[] | null {
    const cacheKey = this.getCacheKey(userLocation, viewScope);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      console.log(`PostCache: Cache miss for ${cacheKey}`);
      return null;
    }

    if (!this.isValidCache(entry)) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      console.log(`PostCache: Cache expired for ${cacheKey}`);
      return null;
    }

    this.stats.hits++;
    console.log(`PostCache: Cache hit for ${cacheKey}, ${entry.posts.length} posts`);
    return [...entry.posts]; // Return copy to prevent mutation
  }

  /**
   * Store posts in cache
   */
  setCachedPosts(
    posts: CachedPost[],
    userLocation: { neighborhood?: string; city?: string; state?: string },
    viewScope: 'neighborhood' | 'city' | 'state'
  ): void {
    const cacheKey = this.getCacheKey(userLocation, viewScope);
    const now = Date.now();

    // Enforce cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldestEntry();
    }

    const entry: CacheEntry = {
      posts: [...posts], // Store copy to prevent external mutation
      timestamp: now,
      lastActivity: now,
      userLocation: { ...userLocation },
      viewScope
    };

    this.cache.set(cacheKey, entry);
    this.stats.lastRefresh = now;
    
    console.log(`PostCache: Cached ${posts.length} posts for ${cacheKey}`);
    
    // Set up auto-refresh for active areas
    this.scheduleRefresh(cacheKey, viewScope);
    
    // Persist to localStorage for cross-session caching
    this.saveToStorage();
  }

  /**
   * Update activity timestamp for a location (indicates user interaction)
   */
  markActivity(
    userLocation: { neighborhood?: string; city?: string; state?: string },
    viewScope: 'neighborhood' | 'city' | 'state'
  ): void {
    const cacheKey = this.getCacheKey(userLocation, viewScope);
    const entry = this.cache.get(cacheKey);
    
    if (entry) {
      entry.lastActivity = Date.now();
      console.log(`PostCache: Updated activity for ${cacheKey}`);
    }
  }

  /**
   * Invalidate cache for specific location
   */
  invalidateLocation(
    userLocation: { neighborhood?: string; city?: string; state?: string },
    viewScope: 'neighborhood' | 'city' | 'state'
  ): void {
    const cacheKey = this.getCacheKey(userLocation, viewScope);
    this.cache.delete(cacheKey);
    
    const timer = this.refreshTimers.get(cacheKey);
    if (timer) {
      clearTimeout(timer);
      this.refreshTimers.delete(cacheKey);
    }
    
    console.log(`PostCache: Invalidated cache for ${cacheKey}`);
  }

  /**
   * Invalidate all caches (for major data changes)
   */
  invalidateAll(): void {
    this.cache.clear();
    this.refreshTimers.forEach(timer => clearTimeout(timer));
    this.refreshTimers.clear();
    this.clearStorage();
    console.log('PostCache: Invalidated all caches');
  }

  /**
   * Schedule automatic cache refresh for active areas
   */
  private scheduleRefresh(cacheKey: string, viewScope: 'neighborhood' | 'city' | 'state'): void {
    // Clear existing timer
    const existingTimer = this.refreshTimers.get(cacheKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Shorter refresh intervals for more specific locations (higher activity)
    const refreshInterval = viewScope === 'neighborhood' ? 30000 : // 30 seconds
                           viewScope === 'city' ? 60000 : // 1 minute
                           120000; // 2 minutes for state

    const timer = setTimeout(() => {
      console.log(`PostCache: Auto-refresh triggered for ${cacheKey}`);
      this.cache.delete(cacheKey);
      this.refreshTimers.delete(cacheKey);
      this.stats.refreshes++;
    }, refreshInterval);

    this.refreshTimers.set(cacheKey, timer);
  }

  /**
   * Remove oldest cache entry when size limit is reached
   */
  private evictOldestEntry(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      const timer = this.refreshTimers.get(oldestKey);
      if (timer) {
        clearTimeout(timer);
        this.refreshTimers.delete(oldestKey);
      }
      console.log(`PostCache: Evicted oldest entry ${oldestKey}`);
    }
  }

  /**
   * Periodic cleanup of expired entries
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (!this.isValidCache(entry)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => {
        this.cache.delete(key);
        const timer = this.refreshTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.refreshTimers.delete(key);
        }
      });

      if (keysToDelete.length > 0) {
        console.log(`PostCache: Cleaned up ${keysToDelete.length} expired entries`);
        this.saveToStorage();
      }
    }, 60000); // Run cleanup every minute
  }

  /**
   * Save cache to localStorage for persistence
   */
  private saveToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        entry: {
          ...entry,
          posts: entry.posts.slice(0, 20) // Limit stored posts to save space
        }
      }));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('PostCache: Failed to save to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const cacheData = localStorage.getItem(this.STORAGE_KEY);
      const statsData = localStorage.getItem(this.STATS_KEY);

      if (cacheData) {
        const entries = JSON.parse(cacheData);
        entries.forEach(({ key, entry }: { key: string, entry: CacheEntry }) => {
          // Only load if not too old
          if (this.isValidCache(entry)) {
            this.cache.set(key, entry);
          }
        });
        console.log(`PostCache: Loaded ${this.cache.size} entries from localStorage`);
      }

      if (statsData) {
        this.stats = { ...this.stats, ...JSON.parse(statsData) };
      }
    } catch (error) {
      console.warn('PostCache: Failed to load from localStorage:', error);
    }
  }

  /**
   * Clear localStorage cache
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.STATS_KEY);
    } catch (error) {
      console.warn('PostCache: Failed to clear localStorage:', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): CacheStats & { cacheSize: number; activeTimers: number } {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      activeTimers: this.refreshTimers.size
    };
  }

  /**
   * Preload cache for user's location hierarchy
   */
  async preloadUserLocationCaches(
    userLocation: { neighborhood?: string; city?: string; state?: string },
    fetchFunction: (location: any, scope: any) => Promise<CachedPost[]>
  ): Promise<void> {
    const preloadTasks = [];

    // Preload all three scope levels for the user's location
    if (userLocation.state) {
      preloadTasks.push(
        this.preloadSingleCache(userLocation, 'state', fetchFunction)
      );
    }
    
    if (userLocation.city && userLocation.state) {
      preloadTasks.push(
        this.preloadSingleCache(userLocation, 'city', fetchFunction)
      );
    }
    
    if (userLocation.neighborhood && userLocation.city && userLocation.state) {
      preloadTasks.push(
        this.preloadSingleCache(userLocation, 'neighborhood', fetchFunction)
      );
    }

    await Promise.all(preloadTasks);
    console.log('PostCache: Preloading completed for user location hierarchy');
  }

  /**
   * Preload single cache entry
   */
  private async preloadSingleCache(
    userLocation: { neighborhood?: string; city?: string; state?: string },
    viewScope: 'neighborhood' | 'city' | 'state',
    fetchFunction: (location: any, scope: any) => Promise<CachedPost[]>
  ): Promise<void> {
    const cacheKey = this.getCacheKey(userLocation, viewScope);
    
    if (this.cache.has(cacheKey) && this.isValidCache(this.cache.get(cacheKey)!)) {
      return; // Already cached and valid
    }

    try {
      const posts = await fetchFunction(userLocation, viewScope);
      this.setCachedPosts(posts, userLocation, viewScope);
    } catch (error) {
      console.error(`PostCache: Failed to preload ${cacheKey}:`, error);
    }
  }
}

// Export singleton instance
export const postCache = new PostCacheService();

// Export types for use in components
export type { CachedPost, CacheStats };