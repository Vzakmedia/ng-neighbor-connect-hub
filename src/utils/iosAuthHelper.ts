/**
 * iOS Authentication Helper Utilities
 * Provides iOS-specific authentication checks and helpers
 */

export const detectIOSAuth = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  
  return {
    isIOS,
    isSafari,
    isIOSSafari: isIOS && isSafari,
  };
};

/**
 * Check if localStorage is available (not in private browsing mode)
 */
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Detect if user is in private browsing mode on iOS Safari
 */
export const isPrivateBrowsing = async (): Promise<boolean> => {
  const { isIOSSafari } = detectIOSAuth();
  
  if (!isIOSSafari) {
    return false;
  }
  
  // Check localStorage availability
  if (!isStorageAvailable()) {
    return true;
  }
  
  // Additional check for iOS Safari private mode
  try {
    // In private mode, indexedDB is not available
    if (!window.indexedDB) {
      return true;
    }
    
    // Try to open a database - will fail in private mode
    return await new Promise((resolve) => {
      const db = indexedDB.open('test');
      db.onsuccess = () => resolve(false);
      db.onerror = () => resolve(true);
    });
  } catch (e) {
    return true;
  }
};

/**
 * Get iOS-specific auth error message
 */
export const getIOSAuthError = (error: string): string => {
  const { isIOSSafari } = detectIOSAuth();
  
  if (!isIOSSafari) {
    return error;
  }
  
  // Check for common iOS issues
  if (error.includes('storage') || error.includes('localStorage')) {
    return 'Please disable Private Browsing mode in Safari Settings and try again.';
  }
  
  if (error.includes('network') || error.includes('fetch')) {
    return 'Connection issue detected. Please check your internet connection and try again.';
  }
  
  return error;
};
