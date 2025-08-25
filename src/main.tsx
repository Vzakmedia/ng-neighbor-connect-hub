import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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

console.log('Starting app render process...');
console.log('iOS Safari compatibility:', /iPad|iPhone|iPod/.test(navigator.userAgent));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
