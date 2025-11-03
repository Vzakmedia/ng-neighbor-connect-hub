import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { initializeAudioOnInteraction, preloadAudioFiles } from '@/utils/audioUtils';
import { nativeAudioManager } from '@/utils/nativeAudioManager';

// Component to initialize audio on app startup
export const AudioInitializer = () => {
  useEffect(() => {
    console.log('AudioInitializer: Setting up audio initialization');
    
    // Initialize native audio immediately on mobile (no user interaction needed)
    if (Capacitor.isNativePlatform()) {
      nativeAudioManager.initialize().then(() => {
        console.log('AudioInitializer: Native audio initialized');
      }).catch(error => {
        console.error('AudioInitializer: Native audio initialization failed:', error);
      });
    }
    
    // Initialize Web Audio on first user interaction (web platform)
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
    
    // Start preloading Web Audio files after a delay (web platform)
    if (!Capacitor.isNativePlatform()) {
      const startPreload = () => {
        setTimeout(() => {
          preloadAudioFiles().catch(console.error);
        }, 1000);
      };
      
      startPreload();
    }

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