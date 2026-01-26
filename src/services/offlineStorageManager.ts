/**
 * Offline Storage Manager
 * Handles storage quota management, prioritization, and pruning
 */

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

/**
 * Priority levels for cached data
 * Higher priority data is kept longer and pruned last
 */
export const STORAGE_PRIORITIES = {
  CRITICAL: ['emergency-contacts', 'profile', 'auth'],
  HIGH: ['conversations', 'notifications'],
  MEDIUM: ['feed', 'events', 'saved-posts'],
  LOW: ['marketplace', 'businesses', 'recommendations'],
} as const;

/**
 * Get priority level for a cache key
 */
export const getPriority = (key: string): number => {
  if (STORAGE_PRIORITIES.CRITICAL.some(k => key.includes(k))) return 4;
  if (STORAGE_PRIORITIES.HIGH.some(k => key.includes(k))) return 3;
  if (STORAGE_PRIORITIES.MEDIUM.some(k => key.includes(k))) return 2;
  if (STORAGE_PRIORITIES.LOW.some(k => key.includes(k))) return 1;
  return 0;
};

export interface StorageStats {
  used: number;
  total: number;
  percentage: number;
  available: number;
  items: number;
}

export interface CacheItem {
  key: string;
  size: number;
  priority: number;
  lastAccessed: number;
}

/**
 * Estimate localStorage usage
 */
const estimateLocalStorageUsage = (): { used: number; items: number } => {
  let used = 0;
  let items = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // Approximate size in bytes (2 bytes per character for UTF-16)
          used += (key.length + value.length) * 2;
          items++;
        }
      }
    }
  } catch (error) {
    console.warn('Error estimating localStorage usage:', error);
  }

  return { used, items };
};

/**
 * Estimate native storage usage
 */
const estimateNativeStorageUsage = async (): Promise<{ used: number; items: number }> => {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const { keys } = await Preferences.keys();
    
    let used = 0;
    for (const key of keys) {
      const { value } = await Preferences.get({ key });
      if (value) {
        used += (key.length + value.length) * 2;
      }
    }
    
    return { used, items: keys.length };
  } catch (error) {
    console.warn('Error estimating native storage usage:', error);
    return { used: 0, items: 0 };
  }
};

/**
 * Offline Storage Manager
 */
export const offlineStorageManager = {
  /**
   * Get current storage usage statistics
   */
  async getStorageUsage(): Promise<StorageStats> {
    const isNative = isNativePlatform();
    
    // Approximate limits (varies by browser/platform)
    const totalEstimate = isNative 
      ? 50 * 1024 * 1024 // ~50MB for native
      : 5 * 1024 * 1024;  // ~5MB for web localStorage

    const { used, items } = isNative
      ? await estimateNativeStorageUsage()
      : estimateLocalStorageUsage();

    return {
      used,
      total: totalEstimate,
      percentage: Math.round((used / totalEstimate) * 100),
      available: totalEstimate - used,
      items,
    };
  },

  /**
   * Get all cached items with metadata
   */
  async getCacheItems(): Promise<CacheItem[]> {
    const items: CacheItem[] = [];

    try {
      if (isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        const { keys } = await Preferences.keys();
        
        for (const key of keys) {
          const { value } = await Preferences.get({ key });
          if (value) {
            items.push({
              key,
              size: (key.length + value.length) * 2,
              priority: getPriority(key),
              lastAccessed: Date.now(), // Would need metadata tracking for accurate value
            });
          }
        }
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value) {
              items.push({
                key,
                size: (key.length + value.length) * 2,
                priority: getPriority(key),
                lastAccessed: Date.now(),
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error getting cache items:', error);
    }

    return items;
  },

  /**
   * Prune low-priority data when approaching storage quota
   * @param targetPercentage - Target usage percentage (default 80%)
   */
  async pruneStorage(targetPercentage: number = 80): Promise<number> {
    const stats = await this.getStorageUsage();
    
    if (stats.percentage <= targetPercentage) {
      console.log('[StorageManager] Storage usage acceptable, no pruning needed');
      return 0;
    }

    console.log(`[StorageManager] Pruning storage: ${stats.percentage}% used, target ${targetPercentage}%`);

    const items = await this.getCacheItems();
    
    // Sort by priority (low first) then by size (large first)
    items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.size - a.size;
    });

    const targetBytes = stats.total * (targetPercentage / 100);
    let currentUsage = stats.used;
    let bytesFreed = 0;

    for (const item of items) {
      if (currentUsage <= targetBytes) break;
      
      // Never prune critical data
      if (item.priority >= 4) continue;

      try {
        if (isNativePlatform()) {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.remove({ key: item.key });
        } else {
          localStorage.removeItem(item.key);
        }

        currentUsage -= item.size;
        bytesFreed += item.size;
        console.log(`[StorageManager] Pruned: ${item.key} (${Math.round(item.size / 1024)}KB)`);
      } catch (error) {
        console.warn(`Failed to prune ${item.key}:`, error);
      }
    }

    console.log(`[StorageManager] Freed ${Math.round(bytesFreed / 1024)}KB`);
    return bytesFreed;
  },

  /**
   * Clear all cached data (except critical)
   */
  async clearCache(includeCritical: boolean = false): Promise<void> {
    const items = await this.getCacheItems();

    for (const item of items) {
      // Skip critical unless explicitly requested
      if (!includeCritical && item.priority >= 4) continue;

      try {
        if (isNativePlatform()) {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.remove({ key: item.key });
        } else {
          localStorage.removeItem(item.key);
        }
      } catch (error) {
        console.warn(`Failed to clear ${item.key}:`, error);
      }
    }

    console.log('[StorageManager] Cache cleared');
  },

  /**
   * Export all offline data as a blob (for backup)
   */
  async exportOfflineData(): Promise<Blob> {
    const items = await this.getCacheItems();
    const data: Record<string, any> = {};

    for (const item of items) {
      try {
        let value: string | null = null;
        
        if (isNativePlatform()) {
          const { Preferences } = await import('@capacitor/preferences');
          const result = await Preferences.get({ key: item.key });
          value = result.value;
        } else {
          value = localStorage.getItem(item.key);
        }

        if (value) {
          try {
            data[item.key] = JSON.parse(value);
          } catch {
            data[item.key] = value;
          }
        }
      } catch (error) {
        console.warn(`Failed to export ${item.key}:`, error);
      }
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      platform: isNativePlatform() ? 'native' : 'web',
      items: Object.keys(data).length,
      data,
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  },

  /**
   * Check if storage is approaching quota
   */
  async isStorageLow(threshold: number = 90): Promise<boolean> {
    const stats = await this.getStorageUsage();
    return stats.percentage >= threshold;
  },

  /**
   * Get human-readable storage info
   */
  async getStorageInfo(): Promise<string> {
    const stats = await this.getStorageUsage();
    const usedMB = (stats.used / (1024 * 1024)).toFixed(2);
    const totalMB = (stats.total / (1024 * 1024)).toFixed(2);
    return `${usedMB}MB / ${totalMB}MB (${stats.percentage}%) - ${stats.items} items`;
  },
};

export default offlineStorageManager;
