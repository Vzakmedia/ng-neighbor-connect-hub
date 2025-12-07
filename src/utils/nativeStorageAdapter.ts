/**
 * Native Storage Adapter for Supabase
 * Uses Capacitor Preferences on native platforms for secure, persistent storage
 * Falls back to localStorage on web
 * 
 * IMPORTANT: Uses lazy initialization to prevent crashes during app startup
 */

// Cache platform detection
let PreferencesModule: any = null;
let isNativeChecked = false;
let isNativePlatform = false;

/**
 * Get timestamp for logging
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Safely check if running on native platform
 * Uses window.Capacitor which is injected by native runtime
 */
const checkIsNative = (): boolean => {
  if (isNativeChecked) {
    return isNativePlatform;
  }

  try {
    // Use window.Capacitor which is injected by native runtime
    // This is safer than require() which may cause bundler issues
    const windowCapacitor = (window as any).Capacitor;
    isNativePlatform = windowCapacitor?.isNativePlatform?.() === true;
    isNativeChecked = true;
    console.log(`[NativeStorage] Platform: ${isNativePlatform ? 'NATIVE' : 'WEB'}`);
    return isNativePlatform;
  } catch (error) {
    console.log(`[NativeStorage] Capacitor not available, defaulting to WEB storage`);
    isNativeChecked = true;
    isNativePlatform = false;
    return false;
  }
};

/**
 * Safely get Preferences module
 */
const getPreferences = async (): Promise<any> => {
  const timestamp = getTimestamp();
  
  if (PreferencesModule) {
    console.log(`[NativeStorage ${timestamp}] Using cached Preferences module`);
    return PreferencesModule.Preferences;
  }

  try {
    console.log(`[NativeStorage ${timestamp}] Loading Preferences module...`);
    PreferencesModule = await import('@capacitor/preferences');
    console.log(`[NativeStorage ${timestamp}] Preferences module loaded successfully`);
    return PreferencesModule.Preferences;
  } catch (error) {
    console.warn(`[NativeStorage ${timestamp}] Failed to load Preferences module:`, error);
    return null;
  }
};

export class NativeStorageAdapter {
  async getItem(key: string): Promise<string | null> {
    const timestamp = getTimestamp();
    console.log(`[NativeStorage ${timestamp}] getItem('${key}') called`);
    
    try {
      if (checkIsNative()) {
        console.log(`[NativeStorage ${timestamp}] Using native Preferences for getItem`);
        const Preferences = await getPreferences();
        if (Preferences) {
          const { value } = await Preferences.get({ key });
          console.log(`[NativeStorage ${timestamp}] getItem('${key}') result: ${value !== null ? 'found' : 'null'}`);
          return value;
        }
        console.log(`[NativeStorage ${timestamp}] Preferences unavailable, falling back to localStorage`);
      }
      // Fallback to localStorage
      const value = localStorage.getItem(key);
      console.log(`[NativeStorage ${timestamp}] localStorage.getItem('${key}') result: ${value !== null ? 'found' : 'null'}`);
      return value;
    } catch (error) {
      console.warn(`[NativeStorage ${timestamp}] getItem('${key}') failed, trying localStorage fallback:`, error);
      try {
        const value = localStorage.getItem(key);
        console.log(`[NativeStorage ${timestamp}] Fallback localStorage.getItem('${key}'): ${value !== null ? 'found' : 'null'}`);
        return value;
      } catch (e) {
        console.error(`[NativeStorage ${timestamp}] All storage methods failed for getItem('${key}')`);
        return null;
      }
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const timestamp = getTimestamp();
    console.log(`[NativeStorage ${timestamp}] setItem('${key}', '${value.substring(0, 20)}...') called`);
    
    try {
      if (checkIsNative()) {
        console.log(`[NativeStorage ${timestamp}] Using native Preferences for setItem`);
        const Preferences = await getPreferences();
        if (Preferences) {
          await Preferences.set({ key, value });
          console.log(`[NativeStorage ${timestamp}] setItem('${key}') successful via Preferences`);
          return;
        }
        console.log(`[NativeStorage ${timestamp}] Preferences unavailable, falling back to localStorage`);
      }
      // Fallback to localStorage
      localStorage.setItem(key, value);
      console.log(`[NativeStorage ${timestamp}] setItem('${key}') successful via localStorage`);
    } catch (error) {
      console.warn(`[NativeStorage ${timestamp}] setItem('${key}') failed, trying localStorage fallback:`, error);
      try {
        localStorage.setItem(key, value);
        console.log(`[NativeStorage ${timestamp}] Fallback localStorage.setItem('${key}') successful`);
      } catch (e) {
        console.error(`[NativeStorage ${timestamp}] All storage methods failed for setItem('${key}')`);
        throw error;
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    const timestamp = getTimestamp();
    console.log(`[NativeStorage ${timestamp}] removeItem('${key}') called`);
    
    try {
      if (checkIsNative()) {
        console.log(`[NativeStorage ${timestamp}] Using native Preferences for removeItem`);
        const Preferences = await getPreferences();
        if (Preferences) {
          await Preferences.remove({ key });
          console.log(`[NativeStorage ${timestamp}] removeItem('${key}') successful via Preferences`);
          return;
        }
        console.log(`[NativeStorage ${timestamp}] Preferences unavailable, falling back to localStorage`);
      }
      // Fallback to localStorage
      localStorage.removeItem(key);
      console.log(`[NativeStorage ${timestamp}] removeItem('${key}') successful via localStorage`);
    } catch (error) {
      console.warn(`[NativeStorage ${timestamp}] removeItem('${key}') failed, trying localStorage fallback:`, error);
      try {
        localStorage.removeItem(key);
        console.log(`[NativeStorage ${timestamp}] Fallback localStorage.removeItem('${key}') successful`);
      } catch (e) {
        console.error(`[NativeStorage ${timestamp}] All storage methods failed for removeItem('${key}')`);
        throw error;
      }
    }
  }
}

// Create singleton instance (safe - no Capacitor import at module level)
console.log(`[NativeStorage ${new Date().toISOString()}] Creating NativeStorageAdapter singleton`);
export const nativeStorageAdapter = new NativeStorageAdapter();
