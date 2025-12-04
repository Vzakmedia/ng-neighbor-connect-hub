/**
 * Native Storage Adapter for Supabase
 * Uses Capacitor Preferences on native platforms for secure, persistent storage
 * Falls back to localStorage on web
 * 
 * IMPORTANT: Uses lazy initialization to prevent crashes during app startup
 */

// Lazy-loaded Capacitor modules
let CapacitorModule: any = null;
let PreferencesModule: any = null;
let isNativeChecked = false;
let isNativePlatform = false;

/**
 * Safely check if running on native platform
 * Uses lazy loading to prevent import crashes
 */
const checkIsNative = (): boolean => {
  if (isNativeChecked) {
    return isNativePlatform;
  }

  try {
    // Lazy load Capacitor
    if (!CapacitorModule) {
      CapacitorModule = require('@capacitor/core');
    }
    isNativePlatform = CapacitorModule?.Capacitor?.isNativePlatform?.() === true;
    isNativeChecked = true;
    console.log('[NativeStorage] Platform check:', isNativePlatform ? 'native' : 'web');
    return isNativePlatform;
  } catch (error) {
    console.log('[NativeStorage] Capacitor not available, using web storage');
    isNativeChecked = true;
    isNativePlatform = false;
    return false;
  }
};

/**
 * Safely get Preferences module
 */
const getPreferences = async (): Promise<any> => {
  if (PreferencesModule) {
    return PreferencesModule.Preferences;
  }

  try {
    PreferencesModule = await import('@capacitor/preferences');
    return PreferencesModule.Preferences;
  } catch (error) {
    console.warn('[NativeStorage] Failed to load Preferences module:', error);
    return null;
  }
};

export class NativeStorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      if (checkIsNative()) {
        const Preferences = await getPreferences();
        if (Preferences) {
          const { value } = await Preferences.get({ key });
          return value;
        }
      }
      // Fallback to localStorage
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`[NativeStorage] Failed to get '${key}', falling back to localStorage:`, error);
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (checkIsNative()) {
        const Preferences = await getPreferences();
        if (Preferences) {
          await Preferences.set({ key, value });
          return;
        }
      }
      // Fallback to localStorage
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[NativeStorage] Failed to set '${key}', trying localStorage:`, error);
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error(`[NativeStorage] All storage methods failed for '${key}'`);
        throw error;
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (checkIsNative()) {
        const Preferences = await getPreferences();
        if (Preferences) {
          await Preferences.remove({ key });
          return;
        }
      }
      // Fallback to localStorage
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[NativeStorage] Failed to remove '${key}', trying localStorage:`, error);
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`[NativeStorage] All storage methods failed for remove '${key}'`);
        throw error;
      }
    }
  }
}

// Create singleton instance (safe - no Capacitor import at module level)
export const nativeStorageAdapter = new NativeStorageAdapter();
