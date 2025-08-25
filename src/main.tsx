import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logIOSCompatibility, detectIOSDevice } from '@/utils/iosCompatibility'
import { IOSErrorBoundary } from '@/components/common/IOSErrorBoundary'

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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IOSErrorBoundary>
      <App />
    </IOSErrorBoundary>
  </StrictMode>
);
