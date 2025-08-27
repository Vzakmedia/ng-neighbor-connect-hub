
// iOS Safari compatibility utilities and feature detection

export interface IOSDeviceInfo {
  isIOS: boolean;
  isSafari: boolean;
  isInPrivateBrowsing: boolean;
  version: number | null;
  supportsLocalStorage: boolean;
  supportsWebSocket: boolean;
  supportsES6: boolean;
}

// Detect iOS device and version
export const detectIOSDevice = (): IOSDeviceInfo => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
  
  // Extract iOS version
  let version: number | null = null;
  if (isIOS) {
    const match = userAgent.match(/OS (\d+)_(\d+)/);
    if (match) {
      version = parseInt(match[1], 10);
    }
  }

  // Test localStorage availability with better error handling
  let supportsLocalStorage = false;
  let isInPrivateBrowsing = false;
  
  try {
    const testKey = '__ios_test_storage__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    supportsLocalStorage = retrieved === testValue;
  } catch (error) {
    supportsLocalStorage = false;
    // Check if it's a SecurityError (common in private browsing)
    if (error && (error as Error).name === 'SecurityError') {
      isInPrivateBrowsing = true;
      console.warn('localStorage blocked - likely private browsing mode');
    }
  }

  // Additional private browsing detection for iOS Safari
  if (isIOS && isSafari && !isInPrivateBrowsing) {
    try {
      // iOS Safari private browsing detection - sessionStorage test
      const testStorage = window.sessionStorage;
      testStorage.setItem('__test__', '1');
      testStorage.removeItem('__test__');
    } catch (e) {
      isInPrivateBrowsing = true;
    }
  }

  // Test WebSocket support
  const supportsWebSocket = 'WebSocket' in window;

  // Test ES6 features safely
  let supportsES6 = false;
  try {
    supportsES6 = typeof Promise !== 'undefined' && 
                  typeof Map !== 'undefined' && 
                  typeof Set !== 'undefined' &&
                  'assign' in Object;
  } catch (e) {
    supportsES6 = false;
  }

  return {
    isIOS,
    isSafari,
    isInPrivateBrowsing,
    version,
    supportsLocalStorage,
    supportsWebSocket,
    supportsES6
  };
};

// Enhanced fallback storage for when localStorage is unavailable
class FallbackStorage {
  private storage: Map<string, string> = new Map();
  private isSecure: boolean = true;

  constructor() {
    // Test if we can use memory storage securely
    try {
      this.storage.set('__init_test__', 'test');
      this.storage.delete('__init_test__');
    } catch (e) {
      this.isSecure = false;
      console.warn('FallbackStorage: Memory storage may be restricted');
    }
  }

  getItem(key: string): string | null {
    if (!this.isSecure) return null;
    try {
      return this.storage.get(key) || null;
    } catch (e) {
      console.warn('FallbackStorage.getItem error:', e);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isSecure) return;
    try {
      this.storage.set(key, value);
    } catch (e) {
      console.warn('FallbackStorage.setItem error:', e);
    }
  }

  removeItem(key: string): void {
    if (!this.isSecure) return;
    try {
      this.storage.delete(key);
    } catch (e) {
      console.warn('FallbackStorage.removeItem error:', e);
    }
  }

  clear(): void {
    if (!this.isSecure) return;
    try {
      this.storage.clear();
    } catch (e) {
      console.warn('FallbackStorage.clear error:', e);
    }
  }

  get length(): number {
    if (!this.isSecure) return 0;
    return this.storage.size;
  }

  key(index: number): string | null {
    if (!this.isSecure) return null;
    const keys = Array.from(this.storage.keys());
    return keys[index] || null;
  }
}

// Get safe storage with enhanced error handling
export const getSafeStorage = (): Storage => {
  const deviceInfo = detectIOSDevice();
  
  if (deviceInfo.supportsLocalStorage) {
    // Test localStorage one more time to be sure
    try {
      const testKey = '__final_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return localStorage;
    } catch (e) {
      console.warn('localStorage failed final test, using fallback');
    }
  }
  
  console.warn('Using fallback storage due to localStorage restrictions');
  return new FallbackStorage() as Storage;
};

// Log iOS compatibility info with security error detection
export const logIOSCompatibility = (): void => {
  const deviceInfo = detectIOSDevice();
  
  console.log('iOS Compatibility Check:', {
    ...deviceInfo,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    features: {
      touchEvents: 'ontouchstart' in window,
      orientation: 'orientation' in window,
      deviceMotion: 'DeviceMotionEvent' in window
    },
    security: {
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      origin: window.location.origin
    }
  });

  if (deviceInfo.isIOS && deviceInfo.version && deviceInfo.version < 12) {
    console.warn('iOS version is old, some features may not work properly');
  }

  if (deviceInfo.isInPrivateBrowsing) {
    console.warn('Private browsing detected - using fallback storage and limited features');
  }

  if (!deviceInfo.supportsES6) {
    console.warn('Limited ES6 support detected');
  }

  // Additional security checks
  if (!window.isSecureContext && window.location.protocol !== 'https:') {
    console.warn('App not running in secure context - some features may be limited');
  }
};

// Safe feature detection
export const safeFeatureDetection = {
  supportsFramerMotion: function(): boolean {
    try {
      const deviceInfo = detectIOSDevice();
      if (deviceInfo.isIOS && deviceInfo.version && deviceInfo.version < 12) {
        return false;
      }
      return typeof requestAnimationFrame !== 'undefined' && 
             'IntersectionObserver' in window &&
             typeof Promise !== 'undefined';
    } catch (e) {
      return false;
    }
  },

  supportsWebGL: function(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!context;
    } catch (e) {
      return false;
    }
  },

  supportsModernJS: function(): boolean {
    try {
      return typeof Promise !== 'undefined' && 
             typeof fetch !== 'undefined' &&
             typeof Map !== 'undefined' &&
             typeof Set !== 'undefined' &&
             'assign' in Object;
    } catch (e) {
      return false;
    }
  }
};

// Security error recovery utilities
export const securityErrorRecovery = {
  clearProblematicStorage: (): boolean => {
    try {
      const keysToRemove = [
        'supabase.auth.token',
        'neighborlink-auth',
        'app_preferences',
        '__Secure-auth-token'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.debug(`Could not remove ${key}:`, e);
        }
      });
      
      return true;
    } catch (e) {
      console.error('Storage cleanup failed:', e);
      return false;
    }
  },

  testStorageAccess: (): boolean => {
    try {
      const testKey = '__security_test__';
      const testValue = Date.now().toString();
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved === testValue;
    } catch (e) {
      return false;
    }
  },

  isSecurityError: (error: Error): boolean => {
    return error.name === 'SecurityError' || 
           error.message?.includes('insecure') ||
           error.message?.includes('SecurityError') ||
           error.message?.includes('cross-origin') ||
           error.message?.includes('Failed to fetch') ||
           error.message?.includes('Network request failed');
  },

  // Enhanced iOS 18 specific error handling
  handleIOSSecurityError: (error: Error): boolean => {
    if (securityErrorRecovery.isSecurityError(error)) {
      console.warn('iOS Security Error detected, attempting recovery...');
      
      // Clear potentially problematic data
      securityErrorRecovery.clearProblematicStorage();
      
      // Force a clean reload with cache busting
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('t', Date.now().toString());
      currentUrl.searchParams.set('ios_recovery', '1');
      
      setTimeout(() => {
        window.location.href = currentUrl.toString();
      }, 100);
      
      return true;
    }
    return false;
  }
};
