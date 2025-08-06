import { useEffect } from 'react';
import { initializeAudioOnInteraction } from '@/utils/audioUtils';

// Component to initialize audio on app startup
export const AudioInitializer = () => {
  useEffect(() => {
    // Initialize audio on first component mount
    const handleInteraction = () => {
      initializeAudioOnInteraction();
    };

    // Add event listeners for various interaction types
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { 
        once: true, 
        passive: true 
      });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  return null; // This component doesn't render anything
};