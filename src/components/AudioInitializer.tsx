import { useEffect } from 'react';
import { initializeAudioOnInteraction, preloadAudioFiles } from '@/utils/audioUtils';

// Component to initialize audio on app startup
export const AudioInitializer = () => {
  useEffect(() => {
    console.log('AudioInitializer: Setting up audio initialization');
    
    // Initialize audio on first component mount
    const handleInteraction = async () => {
      try {
        console.log('AudioInitializer: User interaction detected, initializing audio...');
        await initializeAudioOnInteraction();
        console.log('AudioInitializer: Audio initialized successfully');
      } catch (error) {
        console.error('AudioInitializer: Failed to initialize audio:', error);
      }
    };

    // Add event listeners for various interaction types
    const events = ['click', 'touchstart', 'keydown'];
    
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { 
        once: true, 
        passive: true 
      });
    });
    
    // Also start preloading on page load (will complete after user interaction)
    const startPreload = () => {
      // Delay slightly to not block initial render
      setTimeout(() => {
        preloadAudioFiles().catch(console.error);
      }, 1000);
    };
    
    // Start preload after a short delay
    startPreload();

    // Cleanup
    return () => {
      console.log('AudioInitializer: Cleaning up event listeners');
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  return null; // This component doesn't render anything
};