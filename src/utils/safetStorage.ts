// Safe storage utilities for iOS compatibility

import { getSafeStorage, detectIOSDevice } from './iosCompatibility';

// Enhanced storage wrapper with fallback support
export class SafeStorage {
  private storage: Storage;
  private isLocalStorageAvailable: boolean;

  constructor() {
    this.storage = getSafeStorage();
    this.isLocalStorageAvailable = detectIOSDevice().supportsLocalStorage;
  }

  // Get item with error handling
  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.warn(`SafeStorage: Failed to get item '${key}':`, error);
      return null;
    }
  }

  // Set item with error handling
  setItem(key: string, value: string): boolean {
    try {
      this.storage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`SafeStorage: Failed to set item '${key}':`, error);
      return false;
    }
  }

  // Remove item with error handling
  removeItem(key: string): boolean {
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`SafeStorage: Failed to remove item '${key}':`, error);
      return false;
    }
  }

  // Clear storage with error handling
  clear(): boolean {
    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.warn('SafeStorage: Failed to clear storage:', error);
      return false;
    }
  }

  // Check if storage is persistent (real localStorage vs fallback)
  isPersistent(): boolean {
    return this.isLocalStorageAvailable;
  }

  // Get storage info
  getStorageInfo(): { type: string; persistent: boolean; available: boolean } {
    return {
      type: this.isLocalStorageAvailable ? 'localStorage' : 'fallback',
      persistent: this.isLocalStorageAvailable,
      available: true
    };
  }
}

// Singleton instance
export const safeStorage = new SafeStorage();

// Utility functions for common storage operations
export const storageUtils = {
  // Store user session with fallback
  storeSession: (sessionData: any): boolean => {
    try {
      const data = JSON.stringify(sessionData);
      return safeStorage.setItem('supabase.auth.token', data);
    } catch (error) {
      console.error('Failed to store session:', error);
      return false;
    }
  },

  // Retrieve user session with fallback
  getSession: (): any | null => {
    try {
      const data = safeStorage.getItem('supabase.auth.token');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      return null;
    }
  },

  // Store app preferences
  storePreferences: (prefs: Record<string, any>): boolean => {
    try {
      const data = JSON.stringify(prefs);
      return safeStorage.setItem('app_preferences', data);
    } catch (error) {
      console.error('Failed to store preferences:', error);
      return false;
    }
  },

  // Get app preferences
  getPreferences: (): Record<string, any> => {
    try {
      const data = safeStorage.getItem('app_preferences');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return {};
    }
  },

  // Clear all app data
  clearAppData: (): boolean => {
    try {
      const keys = ['supabase.auth.token', 'app_preferences', 'neighborlink_mobile_onboarding_seen'];
      let success = true;
      
      keys.forEach(key => {
        if (!safeStorage.removeItem(key)) {
          success = false;
        }
      });
      
      return success;
    } catch (error) {
      console.error('Failed to clear app data:', error);
      return false;
    }
  }
};