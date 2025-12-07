const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

/**
 * Native secure storage hook using Capacitor Preferences
 * Automatically falls back to localStorage on web
 */
export const useNativeStorage = () => {
  const setItem = async (key: string, value: string): Promise<void> => {
    try {
      if (isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Failed to set storage item:', error);
    }
  };

  const getItem = async (key: string): Promise<string | null> => {
    try {
      if (isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key });
        return value;
      } else {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('Failed to get storage item:', error);
      return null;
    }
  };

  const removeItem = async (key: string): Promise<void> => {
    try {
      if (isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to remove storage item:', error);
    }
  };

  const clear = async (): Promise<void> => {
    try {
      if (isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  };

  const keys = async (): Promise<string[]> => {
    try {
      if (isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        const result = await Preferences.keys();
        return result.keys;
      } else {
        return Object.keys(localStorage);
      }
    } catch (error) {
      console.error('Failed to get storage keys:', error);
      return [];
    }
  };

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    keys,
    isNative: isNativePlatform(),
  };
};
