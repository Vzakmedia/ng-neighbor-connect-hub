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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
