/**
 * Synchronous-Compatible Native Storage Adapter for Supabase
 * 
 * CRITICAL: Supabase expects synchronous storage methods, but Capacitor Preferences is async.
 * This adapter uses a memory cache for immediate synchronous access and syncs to native storage
 * in the background.
 * 
 * Flow:
 * 1. On app startup, pre-load from native storage into memory cache
 * 2. All reads are synchronous from memory cache
 * 3. All writes update memory cache immediately, then sync to native in background
 */

// Memory cache for synchronous access
const memoryCache = new Map<string, string>();

// Initialization state
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Platform detection (cached)
let cachedIsNative: boolean | null = null;

const isNativePlatform = (): boolean => {
  if (cachedIsNative !== null) return cachedIsNative;
  
  try {
    const windowCapacitor = (window as any).Capacitor;
    cachedIsNative = windowCapacitor?.isNativePlatform?.() === true;
    console.log('[SyncStorage] Platform detected:', cachedIsNative ? 'NATIVE' : 'WEB');
    return cachedIsNative;
  } catch {
    cachedIsNative = false;
    return false;
  }
};

/**
 * Pre-initialize storage by loading from native Preferences into memory cache
 * MUST be called before Supabase client is created
 */
export const initializeNativeSyncStorage = async (): Promise<void> => {
  if (isInitialized) {
    console.log('[SyncStorage] Already initialized');
    return;
  }
  
  if (initPromise) {
    console.log('[SyncStorage] Initialization in progress, waiting...');
    return initPromise;
  }

  initPromise = (async () => {
    const startTime = Date.now();
    console.log('[SyncStorage] Starting initialization...');
    
    try {
      if (isNativePlatform()) {
        console.log('[SyncStorage] Loading from Capacitor Preferences...');
        const { Preferences } = await import('@capacitor/preferences');
        
        // Pre-load auth token specifically
        const authKeys = [
          'neighborlink-auth',
          'sb-cowiviqhrnmhttugozbz-auth-token',
          'supabase.auth.token'
        ];
        
        for (const key of authKeys) {
          try {
            const { value } = await Preferences.get({ key });
            if (value) {
              memoryCache.set(key, value);
              console.log(`[SyncStorage] Pre-loaded key: ${key} (${value.length} chars)`);
            }
          } catch (e) {
            console.warn(`[SyncStorage] Failed to pre-load key: ${key}`, e);
          }
        }
      } else {
        console.log('[SyncStorage] Web platform - using localStorage');
        // Pre-load from localStorage for consistency
        const authKeys = [
          'neighborlink-auth',
          'sb-cowiviqhrnmhttugozbz-auth-token',
          'supabase.auth.token'
        ];
        
        for (const key of authKeys) {
          const value = localStorage.getItem(key);
          if (value) {
            memoryCache.set(key, value);
            console.log(`[SyncStorage] Pre-loaded from localStorage: ${key}`);
          }
        }
      }
      
      isInitialized = true;
      console.log(`[SyncStorage] Initialization complete in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[SyncStorage] Initialization failed:', error);
      isInitialized = true; // Mark as initialized anyway to prevent blocking
    }
  })();

  return initPromise;
};

/**
 * Sync a key-value pair to native storage in the background
 * Non-blocking - errors are logged but don't affect the caller
 */
const syncToNativeStorage = async (key: string, value: string | null): Promise<void> => {
  if (!isNativePlatform()) return;
  
  try {
    const { Preferences } = await import('@capacitor/preferences');
    if (value === null) {
      await Preferences.remove({ key });
      console.log(`[SyncStorage] Removed from native: ${key}`);
    } else {
      await Preferences.set({ key, value });
      console.log(`[SyncStorage] Synced to native: ${key}`);
    }
  } catch (error) {
    console.warn(`[SyncStorage] Failed to sync to native: ${key}`, error);
  }
};

/**
 * Synchronous Storage Adapter compatible with Supabase Auth
 * Uses memory cache for immediate reads, syncs to native in background
 */
export const nativeSyncStorage = {
  /**
   * SYNCHRONOUS getItem - returns immediately from memory cache
   */
  getItem: (key: string): string | null => {
    // First check memory cache (always synchronous)
    if (memoryCache.has(key)) {
      const value = memoryCache.get(key) || null;
      console.log(`[SyncStorage] getItem('${key}'): from cache, ${value ? 'found' : 'null'}`);
      return value;
    }
    
    // Fallback to localStorage (also synchronous)
    try {
      const value = localStorage.getItem(key);
      if (value) {
        memoryCache.set(key, value); // Cache for next time
        console.log(`[SyncStorage] getItem('${key}'): from localStorage, found`);
      } else {
        console.log(`[SyncStorage] getItem('${key}'): not found`);
      }
      return value;
    } catch (e) {
      console.warn(`[SyncStorage] getItem('${key}'): localStorage error`, e);
      return null;
    }
  },

  /**
   * SYNCHRONOUS setItem - updates memory cache immediately
   * Syncs to native storage in background (non-blocking)
   */
  setItem: (key: string, value: string): void => {
    console.log(`[SyncStorage] setItem('${key}'): ${value.length} chars`);
    
    // Update memory cache immediately (synchronous)
    memoryCache.set(key, value);
    
    // Update localStorage as immediate backup (synchronous)
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[SyncStorage] setItem localStorage failed:`, e);
    }
    
    // Sync to native storage in background (non-blocking)
    syncToNativeStorage(key, value).catch(() => {});
  },

  /**
   * SYNCHRONOUS removeItem - updates memory cache immediately
   * Syncs removal to native storage in background
   */
  removeItem: (key: string): void => {
    console.log(`[SyncStorage] removeItem('${key}')`);
    
    // Remove from memory cache immediately (synchronous)
    memoryCache.delete(key);
    
    // Remove from localStorage (synchronous)
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SyncStorage] removeItem localStorage failed:`, e);
    }
    
    // Sync removal to native storage in background (non-blocking)
    syncToNativeStorage(key, null).catch(() => {});
  },
};

/**
 * Check if storage is initialized
 */
export const isStorageInitialized = (): boolean => isInitialized;

/**
 * Get current memory cache contents (for debugging)
 */
export const getStorageDebugInfo = (): { initialized: boolean; cacheKeys: string[]; isNative: boolean } => ({
  initialized: isInitialized,
  cacheKeys: Array.from(memoryCache.keys()),
  isNative: isNativePlatform(),
});
