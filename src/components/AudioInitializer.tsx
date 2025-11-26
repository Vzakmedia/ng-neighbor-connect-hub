import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { initializeAudioOnInteraction, preloadAudioFiles } from '@/utils/audioUtils';
import { nativeAudioManager } from '@/utils/nativeAudioManager';
import { Button } from '@/components/ui/button';
import { Volume2 } from '@/lib/icons';

// Component to initialize audio on app startup with iOS-specific handling
export const AudioInitializer = () => {
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    console.log('AudioInitializer: Setting up audio initialization');
    
    // Check if iOS web needs explicit interaction
    if (isIOS && !isNative) {
      try {
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          if (ctx.state === 'suspended') {
            console.log('AudioInitializer: iOS AudioContext suspended, showing enable button');
            setNeedsInteraction(true);
          }
          ctx.close();
        }
      } catch (error) {
        console.error('AudioInitializer: Failed to check audio context:', error);
      }
    }
    
    // Initialize native audio after first user interaction on mobile
    if (isNative) {
      const handleFirstInteraction = async () => {
        try {
          console.log('AudioInitializer: User interaction detected on native, initializing audio');
          await nativeAudioManager.initialize();
          console.log('AudioInitializer: Native audio initialized');
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('click', handleFirstInteraction);
        } catch (error) {
          console.error('AudioInitializer: Native audio initialization failed:', error);
        }
      };

      document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
      document.addEventListener('click', handleFirstInteraction, { once: true, passive: true });
    }
    
    // Initialize Web Audio on first user interaction (non-iOS web)
    if (!isIOS && !isNative) {
      const handleInteraction = async () => {
        try {
          console.log('AudioInitializer: User interaction detected, initializing audio...');
          await initializeAudioOnInteraction();
          console.log('AudioInitializer: Audio initialized successfully');
        } catch (error) {
          console.error('AudioInitializer: Failed to initialize audio:', error);
        }
      };

      const events = ['click', 'touchstart', 'keydown'];
      events.forEach(event => {
        document.addEventListener(event, handleInteraction, { 
          once: true, 
          passive: true 
        });
      });
    }
    
    // Start preloading Web Audio files after a delay (web platform only)
    if (!isNative) {
      const startPreload = () => {
        setTimeout(() => {
          preloadAudioFiles().catch(console.error);
        }, 1000);
      };
      
      startPreload();
    }
  }, [isIOS, isNative]);

  const handleEnableAudio = async () => {
    setIsInitializing(true);
    try {
      console.log('AudioInitializer: Manually enabling audio');
      
      // Resume audio context
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        await ctx.resume();
        console.log('AudioInitializer: AudioContext resumed');
        ctx.close();
      }

      // Initialize web audio
      await initializeAudioOnInteraction();
      
      setNeedsInteraction(false);
      console.log('AudioInitializer: Audio manually enabled');
    } catch (error) {
      console.error('AudioInitializer: Failed to enable audio:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Show enable button only on iOS web when interaction is needed
  if (needsInteraction && !isNative) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2">
        <Button
          onClick={handleEnableAudio}
          disabled={isInitializing}
          className="flex items-center gap-2 shadow-lg"
          size="lg"
        >
          <Volume2 className="h-4 w-4" />
          {isInitializing ? 'Enabling...' : 'Enable Sounds'}
        </Button>
      </div>
    );
  }

  return null;
};