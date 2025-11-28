import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { nativeAudioManager, type SoundAssetId } from './nativeAudioManager';

// Audio Context for sound generation
let audioContext: AudioContext | null = null;
let audioInitialized = false;
let userInteracted = false;

// Audio buffer cache for instant playback
const audioBufferCache = new Map<string, AudioBuffer>();
let preloadingPromise: Promise<void> | null = null;

// Initialize audio context with mobile support
const getAudioContext = async (): Promise<AudioContext> => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  // Resume audio context if suspended (required for modern browsers and mobile)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  
  return audioContext;
};

// Preload and decode audio files into buffers
export const preloadAudioFiles = async (): Promise<void> => {
  // Return existing promise if already preloading
  if (preloadingPromise) return preloadingPromise;
  
  preloadingPromise = (async () => {
    try {
      const ctx = await getAudioContext();
      const filesToPreload = [
        '/notification.mp3',
        '/notification-bell.mp3',
        '/notification-chime.mp3',
        '/notification-ding.mp3'
      ];
      
      console.log('Preloading audio files...');
      
      const loadPromises = filesToPreload.map(async (file) => {
        try {
          // Skip if already cached
          if (audioBufferCache.has(file)) return;
          
          const response = await fetch(file);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          audioBufferCache.set(file, audioBuffer);
          console.log(`Preloaded: ${file}`);
        } catch (error) {
          console.warn(`Failed to preload ${file}:`, error);
        }
      });
      
      await Promise.all(loadPromises);
      console.log('Audio preloading complete');
    } catch (error) {
      console.error('Audio preloading failed:', error);
    }
  })();
  
  return preloadingPromise;
};

// Play audio from buffer (instant playback)
const playAudioBuffer = async (file: string, volume: number): Promise<void> => {
  const ctx = await getAudioContext();
  const buffer = audioBufferCache.get(file);
  
  if (!buffer) {
    throw new Error(`Audio buffer not found for ${file}`);
  }
  
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  
  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  gainNode.gain.setValueAtTime(Math.min(volume, 1.0), ctx.currentTime);
  source.start(0);
};

// Initialize audio on first user interaction (critical for mobile)
export const initializeAudioOnInteraction = async (): Promise<void> => {
  if (userInteracted) return;
  
  try {
    const ctx = await getAudioContext();
    
    // Create a silent sound to unlock audio context on mobile
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
    
    userInteracted = true;
    audioInitialized = true;
    console.log('Audio initialized for mobile compatibility');
    
    // Start preloading audio files immediately after unlock
    preloadAudioFiles().catch(console.error);
  } catch (error) {
    console.error('Failed to initialize audio:', error);
  }
};

// Available notification sound options
export const NOTIFICATION_SOUNDS = {
  generated: { name: 'Generated Bell', file: null },
  classic: { name: 'Classic Notification', file: '/notification.mp3' },
  bell: { name: 'Bell Ring', file: '/notification-bell.mp3' },
  chime: { name: 'Soft Chime', file: '/notification-chime.mp3' },
  ding: { name: 'Quick Ding', file: '/notification-ding.mp3' }
} as const;

export type NotificationSoundType = keyof typeof NOTIFICATION_SOUNDS;

// Get user's selected notification sound preference
export const getSelectedNotificationSound = async (): Promise<NotificationSoundType> => {
  try {
    const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
    const { getItem } = useNativeStorage();
    const audioSettings = await getItem('audioSettings');
    if (audioSettings) {
      const settings = JSON.parse(audioSettings);
      return settings.notificationSound || 'generated';
    }
    return 'generated'; // Default to generated sound
  } catch (error) {
    console.error('Error getting notification sound preference:', error);
    return 'generated';
  }
};

// Generate a pleasant notification sound
export const generateNotificationSound = async (volume: number = 0.5): Promise<void> => {
  const ctx = await getAudioContext();
  
  // Create oscillator for main tone
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  // Pleasant bell-like tone (major chord)
  oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
  oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
  
  // Envelope for smooth attack and decay
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(volume * 0.1, ctx.currentTime + 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
  
  oscillator.type = 'sine';
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 1.0);
};

// Generate an emergency alert sound (standard EAS tone)
export const generateEmergencySound = async (volume: number = 0.7): Promise<void> => {
  const ctx = await getAudioContext();
  const duration = 2.0;
  
  // Create two oscillators for the distinctive two-tone alert
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  // Mix both oscillators
  const mixer = ctx.createGain();
  osc1.connect(mixer);
  osc2.connect(mixer);
  mixer.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  // Standard EAS frequencies (853 Hz and 960 Hz alternating)
  osc1.frequency.setValueAtTime(853, ctx.currentTime);
  osc2.frequency.setValueAtTime(960, ctx.currentTime);
  
  // Create alternating pattern
  for (let i = 0; i < 8; i++) {
    const time = ctx.currentTime + (i * 0.25);
    if (i % 2 === 0) {
      osc1.frequency.setValueAtTime(853, time);
      osc2.frequency.setValueAtTime(960, time);
    } else {
      osc1.frequency.setValueAtTime(960, time);
      osc2.frequency.setValueAtTime(853, time);
    }
  }
  
  // Sharp attack and release for urgency
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration - 0.1);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  
  osc1.type = 'square';
  osc2.type = 'square';
  
  osc1.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + duration);
  osc2.stop(ctx.currentTime + duration);
};

// Check if notifications and sound are allowed
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    // Check current permission status
    let permission = Notification.permission;
    
    // If permission is not determined, request it
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    return permission === 'granted';
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

// Request push notification permission and register service worker
export const requestPushNotificationPermission = async (): Promise<boolean> => {
  try {
    // Check if service worker and push manager are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return false;
    }

    // Request notification permission first
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      return false;
    }

    // Register service worker
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered');
    }

    return true;
  } catch (error) {
    console.error('Error requesting push notification permission:', error);
    return false;
  }
};

// Send browser push notification
export const sendBrowserNotification = async (title: string, options: NotificationOptions = {}): Promise<void> => {
  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      console.log('No notification permission');
      return;
    }

    // Create notification
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'ng-neighbor-notification',
      requireInteraction: false,
      silent: false,
      ...options
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

  } catch (error) {
    console.error('Error sending browser notification:', error);
  }
};

// Check if user has enabled sound in settings
export const isSoundEnabled = async (): Promise<boolean> => {
  try {
    const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
    const { getItem } = useNativeStorage();
    const audioSettings = await getItem('audioSettings');
    if (audioSettings) {
      const settings = JSON.parse(audioSettings);
      // Default to enabled unless explicitly set to false
      return settings.soundEnabled !== false;
    }
    return true; // Default to enabled if no settings found
  } catch (error) {
    console.error('Error checking sound settings:', error);
    return true; // Default to enabled on error
  }
};

// Get volume level from user settings
export const getSoundVolume = async (): Promise<number> => {
  try {
    const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
    const { getItem } = useNativeStorage();
    const audioSettings = await getItem('audioSettings');
    if (audioSettings) {
      const settings = JSON.parse(audioSettings);
      return settings.volume || 0.5; // Default volume
    }
    return 0.5; // Default volume
  } catch (error) {
    console.error('Error getting sound volume:', error);
    return 0.5; // Default volume on error
  }
};

// Message chime settings (mode + volume) from user settings
export const getMessageChimeSettings = async (): Promise<{ mode: 'single' | 'double'; volume: number }> => {
  try {
    const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
    const { getItem } = useNativeStorage();
    const raw = await getItem('audioSettings');
    const defaults = { mode: 'single' as 'single' | 'double', volume: 0.7 };
    if (!raw) return defaults;
    const s = JSON.parse(raw);
    const volRaw = s.messageChimeVolume ?? s.notificationVolume ?? 0.7;
    const volume = Array.isArray(volRaw)
      ? (typeof volRaw[0] === 'number' ? volRaw[0] : 0.7)
      : (typeof volRaw === 'number' ? volRaw : 0.7);
    const mode: 'single' | 'double' = s.messageChimeMode === 'double' ? 'double' : 'single';
    return { mode, volume: Math.max(0, Math.min(1, volume)) };
  } catch (error) {
    console.error('Error getting message chime settings:', error);
    return { mode: 'single', volume: 0.7 };
  }
};

// Enhanced play notification with permission and settings check
export const playNotification = async (type: 'normal' | 'emergency' | 'notification', customVolume?: number): Promise<void> => {
  // Check if sound is enabled in user settings
  if (!isSoundEnabled()) {
    console.log('Sound disabled in user settings, skipping sound');
    return;
  }

  // Get volume from settings or use custom volume
  const volume = customVolume !== undefined ? customVolume : await getSoundVolume();

  try {
    // Try native audio first on mobile
    if (Capacitor.isNativePlatform() && nativeAudioManager.isNativePlatform()) {
      const assetId: SoundAssetId = type === 'emergency' ? 'emergency' : 'notification';
      const success = await nativeAudioManager.play(assetId, volume);
      
      if (success) {
        console.log(`playNotification: Played native ${assetId}`);
        return;
      }
      
      console.warn('playNotification: Native audio failed, falling back to Web Audio');
    }

    // Web Audio fallback for web or if native fails
    console.log('playNotification called with type:', type, 'volume:', volume);
    
    await initializeAudioOnInteraction();
    
    if (type === 'emergency') {
      console.log('Playing emergency sound');
      await generateEmergencySound(volume);
    } else {
      const selectedSound = await getSelectedNotificationSound();
      console.log('Playing selected notification sound:', selectedSound);
      
      if (selectedSound === 'generated') {
        await generateNotificationSound(volume);
      } else {
        const soundConfig = NOTIFICATION_SOUNDS[selectedSound];
        if (soundConfig.file) {
          try {
            await playAudioBuffer(soundConfig.file, volume);
          } catch (bufferError) {
            console.warn('Buffer playback failed, falling back to Audio element:', bufferError);
            const audio = new Audio(soundConfig.file);
            audio.volume = Math.min(volume, 1.0);
            audio.crossOrigin = 'anonymous';
            audio.preload = 'auto';
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              await playPromise;
            }
          }
        } else {
          await generateNotificationSound(volume);
        }
      }
    }
    console.log('Notification sound played successfully');
  } catch (error) {
    console.error('Error playing notification sound:', error);
    
    // Fallback to vibration on mobile
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: type === 'emergency' ? ImpactStyle.Heavy : ImpactStyle.Medium });
      } catch (hapticError) {
        console.error('Haptic feedback failed:', hapticError);
      }
    } else if ('vibrate' in navigator) {
      if (type === 'emergency') {
        navigator.vibrate([200, 100, 200, 100, 200]);
      } else {
        navigator.vibrate([100]);
      }
    }
  }
};

// Play ringback tone for outgoing calls
export const playRingbackTone = async (volume: number = 0.4): Promise<void> => {
  const ctx = await getAudioContext();
  
  // Create a pleasant ringing pattern (ring-ring, pause, ring-ring)
  const playRing = async (startTime: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Pleasant phone ring frequencies
    osc.frequency.setValueAtTime(440, startTime); // A4
    osc.frequency.setValueAtTime(554.37, startTime + 0.2); // C#5
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.05);
    gainNode.gain.setValueAtTime(volume, startTime + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
    
    osc.type = 'sine';
    osc.start(startTime);
    osc.stop(startTime + 0.8);
  };
  
  // Play two rings with a pause
  await playRing(ctx.currentTime);
  await playRing(ctx.currentTime + 0.9);
};

// Stop ringback tone (called when call is answered or cancelled)
let ringbackIntervalId: NodeJS.Timeout | null = null;

export const startRingbackTone = async (volume: number = 0.4): Promise<void> => {
  console.log('Starting ringback tone');
  
  if (!await isSoundEnabled()) {
    console.log('Sound disabled, skipping ringback tone');
    return;
  }
  
  // Stop any existing ringback
  stopRingbackTone();
  
  // Play initial ringback
  await playRingbackTone(volume);
  
  // Continue playing every 3 seconds
  ringbackIntervalId = setInterval(async () => {
    await playRingbackTone(volume);
  }, 3000);
};

export const stopRingbackTone = (): void => {
  console.log('Stopping ringback tone');
  if (ringbackIntervalId) {
    clearInterval(ringbackIntervalId);
    ringbackIntervalId = null;
  }
};

// Play emergency alert sound specifically for critical alerts
export const playEmergencyAlert = async (): Promise<void> => {
  try {
    console.log('Playing emergency alert sound');
    
    if (!isSoundEnabled()) {
      console.log('Sound disabled in user settings, skipping emergency alert');
      return;
    }

    // Play emergency sound at high volume
    await playNotification('emergency', 0.9);

    // Vibrate for emphasis on mobile
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 300);
      } catch {}
    }

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 EMERGENCY ALERT', {
        body: 'Emergency alert in your area',
        icon: '/favicon.ico',
        silent: false,
        requireInteraction: true,
        tag: 'emergency-alert'
      });
    }
    
  } catch (error) {
    console.error('Error playing emergency alert:', error);
  }
};

// New: Play a beautiful, melodic messaging chime
export const playMessagingChime = async (
  volumeOverride?: number,
  modeOverride?: 'single' | 'double'
): Promise<void> => {
  try {
    if (!(await isSoundEnabled())) return;

    const { mode, volume } = await getMessageChimeSettings();
    const vol = Math.min(volumeOverride ?? volume ?? 0.7, 1.0);
    const modeToUse: 'single' | 'double' = modeOverride ?? mode ?? 'single';

    console.log(`playMessagingChime: Playing ${modeToUse} chime at volume ${vol}`);

    // Try native audio first on mobile
    if (Capacitor.isNativePlatform() && nativeAudioManager.isNativePlatform()) {
      const success = await nativeAudioManager.play('message-chime', vol);
      
      if (success) {
        if (modeToUse === 'double') {
          setTimeout(() => nativeAudioManager.play('message-chime', vol), 200);
        }
        console.log('playMessagingChime: Played native audio');
        return;
      }
      
      console.warn('playMessagingChime: Native audio failed, falling back');
    }

    // Web Audio fallback
    await initializeAudioOnInteraction();

    const playOnce = async (): Promise<void> => {
      try {
        await playAudioBuffer('/notification-chime.mp3', vol);
      } catch (bufferErr) {
        console.warn('Chime buffer playback failed:', bufferErr);
        try {
          const audio = new Audio('/notification-chime.mp3');
          audio.volume = vol;
          audio.preload = 'auto';
          audio.crossOrigin = 'anonymous';

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (fileErr) {
          // Generated chime fallback
          const ctx = await getAudioContext();
          const baseTime = ctx.currentTime + 0.05;

          const notes = [
            { freq: 659.25, dur: 0.14, offset: 0.0 },
            { freq: 880.0,  dur: 0.16, offset: 0.16 },
            { freq: 987.77, dur: 0.18, offset: 0.34 },
          ];

          notes.forEach(({ freq, dur, offset }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, baseTime + offset);

            gain.gain.setValueAtTime(0, baseTime + offset);
            gain.gain.linearRampToValueAtTime(Math.min(vol * 0.35, 0.6), baseTime + offset + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, baseTime + offset + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(baseTime + offset);
            osc.stop(baseTime + offset + dur + 0.02);
          });
        }
      }
    };

    await playOnce();
    if (modeToUse === 'double') {
      await new Promise((r) => setTimeout(r, 120));
      await playOnce();
    }
  } catch (err) {
    console.error('playMessagingChime failed', err);
  }
};

// New: Ringtone player for incoming calls (melodious loop)
export const createRingtonePlayer = () => {
  let timer: number | null = null;
  let active = false;
  let nativeRingtoneActive = false;

  const scheduleCycle = async () => {
    const ctx = await getAudioContext();
    const t0 = ctx.currentTime + 0.05;
    const pattern = [
      { f: 440.0, d: 0.25, o: 0.00 },
      { f: 554.37, d: 0.22, o: 0.28 },
      { f: 659.25, d: 0.22, o: 0.52 },
      { f: 880.0, d: 0.35, o: 0.78 },
    ];

    const soundVolume = await getSoundVolume();
    const volume = Math.min(soundVolume * 0.9, 0.9);

    pattern.forEach(({ f, d, o }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t0 + o);

      gain.gain.setValueAtTime(0, t0 + o);
      gain.gain.linearRampToValueAtTime(volume * 0.4, t0 + o + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + o + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t0 + o);
      osc.stop(t0 + o + d + 0.05);
    });
  };

  return {
    start: async () => {
      if (active) return;
      active = true;

      // Try native audio looping on mobile
      if (Capacitor.isNativePlatform() && nativeAudioManager.isNativePlatform()) {
        const success = await nativeAudioManager.loop('ringtone', 0.5);
        
        if (success) {
          console.log('createRingtonePlayer: Started native ringtone loop');
          nativeRingtoneActive = true;
          return;
        }
        
        console.warn('createRingtonePlayer: Native loop failed, using Web Audio');
      }

      // Web Audio fallback
      await initializeAudioOnInteraction();
      const loop = async () => {
        if (!active) return;
        await scheduleCycle();
        timer = window.setTimeout(loop, 2200);
      };
      loop();
    },
    stop: async () => {
      active = false;

      // Stop native ringtone if active
      if (nativeRingtoneActive) {
        await nativeAudioManager.stop('ringtone');
        nativeRingtoneActive = false;
        console.log('createRingtonePlayer: Stopped native ringtone');
        return;
      }

      // Stop Web Audio timer
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  } as const;
};

// Add global click handler to initialize audio on first user interaction
if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    initializeAudioOnInteraction();
    // Remove listeners after first interaction
    document.removeEventListener('click', handleFirstInteraction);
    document.removeEventListener('touchstart', handleFirstInteraction);
    document.removeEventListener('keydown', handleFirstInteraction);
  };

  // Listen for various user interactions
  document.addEventListener('click', handleFirstInteraction, { once: true, passive: true });
  document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
  document.addEventListener('keydown', handleFirstInteraction, { once: true, passive: true });
}
