// ============= CRITICAL: STORE ORIGINAL FETCH BEFORE ANY IMPORTS =============
// CapacitorHttp patches window.fetch - we need the original for Supabase auth
// This MUST be at the very top before any other code runs
(window as any).__originalFetch__ = window.fetch.bind(window);
console.log('[main.tsx] Original fetch stored before CapacitorHttp can patch it');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import App from './App.tsx'
import './index.css'
import { logIOSCompatibility, detectIOSDevice } from '@/utils/iosCompatibility'
import { IOSErrorBoundary } from '@/components/common/IOSErrorBoundary'
import { performanceMonitor } from './utils/performanceMonitoring'
import { initializeNativeSyncStorage } from '@/utils/nativeSyncStorage'

// ============= URL CLEANUP FOR CORRUPTED HASH URLS =============
// Fix corrupted URLs caused by HashRouter/BrowserRouter conflicts
const cleanCorruptedUrl = () => {
  const href = window.location.href;
  
  // Detect corrupted URL patterns (repeated encoded hash/query strings)
  if (href.includes('%23/') || href.includes('%3F__lovable_token=')) {
    console.warn('[main.tsx] Corrupted URL detected, cleaning...');
    
    // Extract the base URL and get the intended path
    const baseUrl = window.location.origin;
    
    // Try to find the actual intended route from the URL
    const hashMatch = href.match(/#\/([a-zA-Z0-9-/]*)/);
    const pathMatch = href.match(/\/([a-zA-Z0-9-]+)(?:%3F|%23|\?|#|$)/);
    
    let targetPath = '/';
    if (hashMatch && hashMatch[1]) {
      targetPath = '/' + hashMatch[1].split(/[?#%]/)[0];
    } else if (pathMatch && pathMatch[1] && pathMatch[1] !== 'dashboard%3F') {
      targetPath = '/' + pathMatch[1];
    }
    
    // Preserve lovable token if present
    const tokenMatch = href.match(/__lovable_token=([^&#%]+)/);
    const tokenParam = tokenMatch ? `?__lovable_token=${tokenMatch[1]}` : '';
    
    const cleanUrl = baseUrl + targetPath + tokenParam;
    console.log('[main.tsx] Redirecting to clean URL:', cleanUrl);
    
    // Use replace to avoid adding to history
    window.location.replace(cleanUrl);
    return true; // Indicate we're redirecting
  }
  return false;
};

// Run URL cleanup immediately - if corrupted, stop execution
if (cleanCorruptedUrl()) {
  // Stop execution, page will reload with clean URL
  throw new Error('URL cleanup redirect in progress');
}

// ============= NATIVE APP STARTUP LOGGING =============
console.log('[main.tsx] Script loaded, timestamp:', Date.now());
console.log('[main.tsx] User agent:', navigator.userAgent);
console.log('[main.tsx] Location:', window.location.href);

// Check for Capacitor availability early
try {
  const hasCapacitor = typeof (window as any).Capacitor !== 'undefined';
  console.log('[main.tsx] Capacitor global available:', hasCapacitor);
} catch (e) {
  console.log('[main.tsx] Capacitor check error:', e);
}

// ============= BLOCKING STORAGE INITIALIZATION =============
// CRITICAL: Must initialize storage BEFORE React renders and Supabase client is used
// This ensures auth tokens are loaded from Capacitor Preferences into memory cache
let storageInitialized = false;

const initStorageBlocking = async (): Promise<void> => {
  if (storageInitialized) {
    console.log('[main.tsx] Storage already initialized');
    return;
  }
  
  try {
    console.log('[main.tsx] BLOCKING: Initializing native storage...');
    await initializeNativeSyncStorage();
    storageInitialized = true;
    console.log('[main.tsx] Native storage initialized successfully');
  } catch (error) {
    console.error('[main.tsx] Storage initialization failed:', error);
    storageInitialized = true; // Continue anyway with fallback
  }
};

// Defer performance monitoring to avoid blocking initial load
setTimeout(() => {
  performanceMonitor.initialize();
  performanceMonitor.startMemoryMonitoring();
}, 3000);

// Wrap WebSocket to intercept preview domain connections at the source
const originalWebSocket = window.WebSocket;
window.WebSocket = class extends originalWebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols);
    
    const urlString = url.toString();
    
    // Intercept Lovable preview WebSocket connections
    if (urlString.includes('lovableproject.com') || urlString.includes('lovable.app')) {
      console.debug('Preview WebSocket suppressed:', urlString);
      
      // Prevent error events from bubbling
      this.addEventListener('error', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      
      // Prevent close events from bubbling
      this.addEventListener('close', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    }
  }
} as any;

// Configure React Query with optimized defaults for feed performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      staleTime: 60 * 1000, // Increased from 30s to 60s for stale-while-revalidate
      retry: 2, // Increased from 1 to 2
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      gcTime: 30 * 60 * 1000, // Increased from 5min to 30min (keep in memory longer)
      networkMode: 'offlineFirst', // Prefer cache first
    },
    mutations: {
      retry: 1,
    },
  },
})

// Create persister for offline cache with optimizations
// Defensive persister creation with fallback for iOS private browsing
const createPersister = () => {
  try {
    // Test localStorage access
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: 'REACT_QUERY_OFFLINE_CACHE',
      serialize: (data) => {
        try {
          // Only persist essential data to reduce localStorage size
          const optimized = {
            ...data,
            buster: Date.now(), // Cache buster for tracking age
          };
          return JSON.stringify(optimized);
        } catch (e) {
          console.warn('Failed to serialize cache:', e);
          return '{}';
        }
      },
      deserialize: (data) => {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.warn('Failed to deserialize cache:', e);
          return {};
        }
      },
      throttleTime: 1000, // Only save to localStorage max once per second
    });
  } catch (error) {
    console.warn('localStorage unavailable (likely iOS private browsing), using memory-only cache:', error);
    // Return a no-op persister that doesn't actually persist
    return {
      persistClient: async () => {},
      restoreClient: async () => undefined,
      removeClient: async () => {},
    } as any;
  }
};

const persister = createPersister();

// Capacitor type definitions
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }
}

// Global error handler for WebSocket connection errors to prevent console spam
window.addEventListener('error', (event) => {
  // Suppress WebSocket connection errors from showing in console
  if (event.message?.includes('WebSocket') || event.message?.includes('websocket') || 
      event.filename?.includes('supabase') || event.error?.toString()?.includes('WebSocket')) {
    console.debug('WebSocket error suppressed (handled gracefully):', event.error || event.message);
    event.preventDefault();
    return;
  }
});

// Also handle unhandled promise rejections that might be WebSocket related
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.toString() || '';
  if (reason.includes('WebSocket') || reason.includes('websocket') || reason.includes('realtime')) {
    console.debug('WebSocket promise rejection suppressed (handled gracefully):', event.reason);
    event.preventDefault();
    return;
  }
});

// iOS Safari-specific viewport fix
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Set initial viewport height
setViewportHeight();

// Update on resize (handles iOS Safari dynamic viewport)
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// Helper functions for environment detection
const isNativeApp = () => {
  return window.Capacitor?.isNativePlatform?.() === true;
};

const isLovablePreview = () => {
  return window.location.hostname.includes('lovableproject.com') || 
         window.location.hostname.includes('lovable.app') ||
         window.location.hostname.includes('id-preview--');
};

// Defer service worker registration to not block initial load
if ('serviceWorker' in navigator && import.meta.env.PROD && !isLovablePreview()) {
  // Use requestIdleCallback or timeout to defer registration
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered for native app:', registration);
      })
      .catch(error => {
        console.debug('SW registration skipped (web mode):', error);
      });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(registerSW);
  } else {
    setTimeout(registerSW, 5000);
  }
} else if (isLovablePreview()) {
  console.log('Running in Lovable preview - service worker disabled for web compatibility');
}

// Cache iOS detection and defer detailed logging
let deviceInfo: any = null;

// Quick synchronous detection for critical checks
const quickIOSCheck = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return { isIOS, cached: true };
};

// Defer full iOS compatibility logging to not block startup
setTimeout(() => {
  console.log('Starting deferred iOS compatibility check...');
  deviceInfo = detectIOSDevice();
  logIOSCompatibility();
}, 1000);

// Use quick check for immediate needs
deviceInfo = quickIOSCheck();

// Enhanced error handling for iOS
if (deviceInfo.isIOS) {
  // Add iOS-specific error handlers
  window.addEventListener('error', (event) => {
    if (event.message?.includes('Script error') || 
        event.message?.includes('ResizeObserver') ||
        event.message?.includes('Non-Error promise rejection')) {
      console.debug('iOS Error suppressed (non-critical):', event.error || event.message);
      event.preventDefault();
      return;
    }
  });

  // Handle iOS Safari specific issues
  if (!deviceInfo.supportsLocalStorage) {
    console.warn('localStorage not available - app will use fallback storage');
  }
  
  if (deviceInfo.version && deviceInfo.version < 12) {
    console.warn('iOS version is quite old, some features may not work optimally');
  }
}

console.log('[main.tsx] About to create root element');
const rootElement = document.getElementById("root");
console.log('[main.tsx] Root element found:', !!rootElement);

if (!rootElement) {
  console.error('[main.tsx] FATAL: Root element not found!');
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
console.log('[main.tsx] React root created');

// CRITICAL: Initialize storage BLOCKING before rendering React
// This ensures auth tokens are available when Supabase client initializes
const renderApp = async () => {
  try {
    // MUST wait for storage to be ready before rendering
    await initStorageBlocking();
    
    console.log('[main.tsx] Storage ready, rendering app...');
    root.render(
      <StrictMode>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
            dehydrateOptions: {
              shouldDehydrateQuery: (query) => {
                // Only persist successful feed queries
                if (query.queryKey[0] === 'feed') {
                  const data = query.state.data as any;
                  if (data?.pages) {
                    // Keep only first 2 pages (~40 posts) to reduce localStorage size
                    const limitedData = {
                      ...data,
                      pages: data.pages.slice(0, 2),
                    };
                    query.state.data = limitedData;
                  }
                  return query.state.status === 'success'; // Only persist successful queries
                }
                return false;
              },
            },
          }}
          onSuccess={() => {
            console.log('✅ React Query cache hydrated from localStorage');
          }}
        >
          <IOSErrorBoundary>
            <App />
          </IOSErrorBoundary>
        </PersistQueryClientProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('[main.tsx] App initialization error:', error);
    // Render anyway as fallback
    root.render(
      <StrictMode>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
          <IOSErrorBoundary>
            <App />
          </IOSErrorBoundary>
        </PersistQueryClientProvider>
      </StrictMode>
    );
  }
};

renderApp();

// Remove the temporary loader after React has painted
requestAnimationFrame(() => {
  setTimeout(() => {
    const loader = document.getElementById('app-loader');
    if (loader) {
      // Fade out smoothly
      loader.style.transition = 'opacity 300ms ease-out';
      loader.style.opacity = '0';
      
      // Remove from DOM after transition completes
      setTimeout(() => {
        loader.remove();
      }, 300);
    }
  }, 100); // Small delay to ensure React has rendered
});

// EMERGENCY TIMEOUT: Force remove loader if React doesn't mount properly
setTimeout(() => {
  const emergencyLoader = document.getElementById('app-loader');
  if (emergencyLoader && emergencyLoader.style.opacity !== '0') {
    console.error('[main.tsx] EMERGENCY TIMEOUT: React did not mount in 10s, forcing loader removal');
    emergencyLoader.style.display = 'none';
    emergencyLoader.remove();
    
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding:40px;text-align:center;font-family:system-ui;color:#333;';
    errorDiv.innerHTML = '<h2>App Loading Issue</h2><p>Please close and reopen the app.</p><button onclick="location.reload()" style="padding:12px 24px;font-size:16px;margin-top:16px;cursor:pointer;">Retry</button>';
    document.body.appendChild(errorDiv);
  }
}, 10000);
