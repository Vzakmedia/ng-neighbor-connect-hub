import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import App from './App.tsx'
import './index.css'
import { logIOSCompatibility, detectIOSDevice } from '@/utils/iosCompatibility'
import { IOSErrorBoundary } from '@/components/common/IOSErrorBoundary'

// Configure React Query with optimized defaults for feed performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      staleTime: 30 * 1000, // 30s cache for instant back-navigation
      retry: 1, // Reduce wait time on errors
      gcTime: 5 * 60 * 1000, // 5 min garbage collection (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
})

// Create persister for offline cache
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
})

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
         window.location.hostname.includes('lovable.app');
};

// Register service worker ONLY for true native builds (App Store), not web previews
// This prevents iOS Safari errors when accessing the app through Lovable preview URLs
if ('serviceWorker' in navigator && import.meta.env.PROD && !isLovablePreview()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered for native app:', registration);
      })
      .catch(error => {
        // Service worker registration can fail on iOS Safari - this is expected for web mode
        console.debug('SW registration skipped (web mode):', error);
      });
  });
} else if (isLovablePreview()) {
  console.log('Running in Lovable preview - service worker disabled for web compatibility');
}

// Log iOS compatibility information
console.log('Starting app render process...');
logIOSCompatibility();

const deviceInfo = detectIOSDevice();

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

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist feed queries for offline viewing
            return query.queryKey[0] === 'feed';
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

// Remove the temporary loader after React hydration
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
