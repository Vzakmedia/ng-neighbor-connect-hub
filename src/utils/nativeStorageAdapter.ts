import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Native Storage Adapter for Supabase
 * Uses Capacitor Preferences on native platforms for secure, persistent storage
 * Falls back to localStorage on web
 */
export class NativeStorageAdapter {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isNative) {
        const { value } = await Preferences.get({ key });
        return value;
      } else {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Failed to get item '${key}':`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isNative) {
        await Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Failed to set item '${key}':`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isNative) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to remove item '${key}':`, error);
      throw error;
    }
  }
}

export const nativeStorageAdapter = new NativeStorageAdapter();
