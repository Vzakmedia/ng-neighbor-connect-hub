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

  // Test localStorage availability (fails in private browsing)
  let supportsLocalStorage = false;
  try {
    const testKey = '__ios_test_storage__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    supportsLocalStorage = true;
  } catch (e) {
    supportsLocalStorage = false;
  }

  // Test private browsing mode
  let isInPrivateBrowsing = false;
  try {
    if (isIOS && isSafari) {
      // iOS Safari private browsing detection
      const testStorage = window.sessionStorage;
      testStorage.setItem('__test__', '1');
      testStorage.removeItem('__test__');
    }
  } catch (e) {
    isInPrivateBrowsing = true;
  }

  // Test WebSocket support
  const supportsWebSocket = 'WebSocket' in window;

  // Test ES6 features
  let supportsES6 = false;
  try {
    // Test arrow functions and const
    eval('const test = () => true; supportsES6 = test();');
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

// Fallback storage for when localStorage is unavailable
class FallbackStorage {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  get length(): number {
    return this.storage.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.storage.keys());
    return keys[index] || null;
  }
}

// Get safe storage (localStorage or fallback)
export const getSafeStorage = (): Storage => {
  const deviceInfo = detectIOSDevice();
  
  if (deviceInfo.supportsLocalStorage) {
    return localStorage;
  }
  
  console.warn('localStorage unavailable (likely private browsing), using fallback storage');
  return new FallbackStorage() as Storage;
};

// Log iOS compatibility info
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
    }
  });

  if (deviceInfo.isIOS && deviceInfo.version && deviceInfo.version < 10) {
    console.warn('iOS version is very old, some features may not work properly');
  }

  if (deviceInfo.isInPrivateBrowsing) {
    console.warn('Private browsing detected, using fallback storage');
  }

  if (!deviceInfo.supportsES6) {
    console.warn('Limited ES6 support detected, some features may not work');
  }
};

// Error boundary for iOS-specific issues
export class IOSErrorBoundary extends Error {
  constructor(message: string, public deviceInfo: IOSDeviceInfo) {
    super(`iOS Error: ${message}`);
    this.name = 'IOSErrorBoundary';
  }
}

// Safe feature detection
export const safeFeatureDetection = {
  // Test if Framer Motion will work
  supportsFramerMotion: (): boolean => {
    try {
      const deviceInfo = detectIOSDevice();
      if (deviceInfo.isIOS && deviceInfo.version && deviceInfo.version < 10) {
        return false;
      }
      return 'requestAnimationFrame' in window && 'IntersectionObserver' in window;
    } catch (e) {
      return false;
    }
  },

  // Test if WebGL will work
  supportsWebGL: (): boolean => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  },

  // Test if modern JavaScript features work
  supportsModernJS: (): boolean => {
    try {
      return typeof Promise !== 'undefined' && 
             typeof fetch !== 'undefined' &&
             typeof Map !== 'undefined';
    } catch (e) {
      return false;
    }
  }
};