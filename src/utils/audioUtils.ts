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
export const getSelectedNotificationSound = (): NotificationSoundType => {
  try {
    const audioSettings = localStorage.getItem('audioSettings');
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
export const isSoundEnabled = (): boolean => {
  try {
    const audioSettings = localStorage.getItem('audioSettings');
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
export const getSoundVolume = (): number => {
  try {
    const audioSettings = localStorage.getItem('audioSettings');
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
export const getMessageChimeSettings = (): { mode: 'single' | 'double'; volume: number } => {
  try {
    const raw = localStorage.getItem('audioSettings');
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
  try {
    console.log('playNotification called with type:', type, 'customVolume:', customVolume);
    
    // For mobile compatibility, ensure audio is initialized
    if (!userInteracted) {
      console.log('Audio not initialized due to mobile restrictions, trying to initialize...');
      await initializeAudioOnInteraction();
    }
    
    // Proceed without requiring Notification permission; sounds can play in-app
    // (Browser push notifications are handled separately)

    // Check if sound is enabled in user settings
    if (!isSoundEnabled()) {
      console.log('Sound disabled in user settings, skipping sound');
      return;
    }

    // Get volume from settings or use custom volume
    const volume = customVolume !== undefined ? customVolume : getSoundVolume();
    console.log('Playing notification with volume:', volume, 'type:', type);
    
    // Ensure audio is initialized first
    await initializeAudioOnInteraction();
    
    try {
      if (type === 'emergency') {
        console.log('Playing emergency sound');
        await generateEmergencySound(volume);
      } else {
        // Play user's preferred notification sound
        const selectedSound = getSelectedNotificationSound();
        console.log('Playing selected notification sound:', selectedSound);
        
        if (selectedSound === 'generated') {
          await generateNotificationSound(volume);
        } else {
          // Use selected audio file with buffer playback
          const soundConfig = NOTIFICATION_SOUNDS[selectedSound];
          if (soundConfig.file) {
            console.log('Playing audio file from buffer:', soundConfig.file);
            try {
              // Try buffer playback first (instant)
              await playAudioBuffer(soundConfig.file, volume);
              console.log('Audio buffer played successfully');
            } catch (bufferError) {
              console.warn('Buffer playback failed, falling back to Audio element:', bufferError);
              // Fallback to traditional Audio element
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
            // Fallback to generated sound
            console.log('No file found, using generated sound');
            await generateNotificationSound(volume);
          }
        }
      }
      console.log('Notification sound played successfully');
    } catch (audioError) {
      console.error('Selected audio failed:', audioError);
      throw audioError; // Let it fall through to fallbacks
    }
    
  } catch (error) {
    console.error('Error playing notification sound:', error);
    
    // Enhanced fallback chain for mobile
    try {
      console.log('Trying fallback with notification.mp3');
      const audio = new Audio('/notification.mp3');
      const volume = customVolume !== undefined ? customVolume : getSoundVolume();
      audio.volume = Math.min(volume, 1.0);
      
      // Add mobile-specific audio handling
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      
      // For mobile, we need to handle play promise
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      console.log('Fallback audio file played');
    } catch (fallbackError) {
      console.error('Fallback audio also failed:', fallbackError);
      
      // Try vibration as final fallback on mobile
      if ('vibrate' in navigator && isSoundEnabled()) {
        if (type === 'emergency') {
          navigator.vibrate([200, 100, 200, 100, 200]); // Emergency pattern
        } else {
          navigator.vibrate([100]); // Normal notification
        }
        console.log('Used vibration as audio fallback');
      }
      
      // Final fallback to system notification (but only if user has enabled sounds)
      if ('Notification' in window && isSoundEnabled()) {
        new Notification('New alert', { 
          silent: false,
          tag: 'audio-fallback-notification'
        });
      }
    }
  }
};

// Play emergency alert sound specifically for critical alerts
export const playEmergencyAlert = async (): Promise<void> => {
  try {
    console.log('Playing emergency alert sound');
    
    // Check settings only (sound may play without Notification permission)
    if (!isSoundEnabled()) {
      console.log('Sound disabled in user settings, skipping emergency alert');
      return;
    }

    // Play emergency sound at high volume for emergencies
    const volume = Math.min(getSoundVolume() * 1.5, 1.0); // Boost volume for emergencies but cap at 1.0
    await generateEmergencySound(volume);
    
    // Also show a browser notification for emergencies (only if permission granted)
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
    // Respect global sound toggle
    if (!isSoundEnabled()) return;

    await initializeAudioOnInteraction();

    const { mode, volume } = getMessageChimeSettings();
    const vol = Math.min(volumeOverride ?? volume ?? 0.7, 1.0);
    const modeToUse: 'single' | 'double' = modeOverride ?? mode ?? 'single';

    const playOnce = async (): Promise<void> => {
      try {
        // Try buffer playback first (instant)
        await playAudioBuffer('/notification-chime.mp3', vol);
      } catch (bufferErr) {
        console.warn('Chime buffer playback failed, trying fallback:', bufferErr);
        try {
          // Fallback to Audio element
          const audio = new Audio('/notification-chime.mp3');
          audio.volume = vol;
          audio.preload = 'auto';
          audio.crossOrigin = 'anonymous';

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (fileErr) {
          // Fallback to generated chime
          const ctx = await getAudioContext();
          const baseTime = ctx.currentTime + 0.05;

          const notes = [
            { freq: 659.25, dur: 0.14, offset: 0.0 },  // E5
            { freq: 880.0,  dur: 0.16, offset: 0.16 }, // A5 (sweeter interval)
            { freq: 987.77, dur: 0.18, offset: 0.34 }, // B5
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

  const scheduleCycle = async () => {
    const ctx = await getAudioContext();
    const t0 = ctx.currentTime + 0.05;
    const pattern = [
      // A gentle arpeggio in A major
      { f: 440.0, d: 0.25, o: 0.00 }, // A4
      { f: 554.37, d: 0.22, o: 0.28 }, // C#5
      { f: 659.25, d: 0.22, o: 0.52 }, // E5
      { f: 880.0, d: 0.35, o: 0.78 },  // A5
    ];

    const volume = Math.min(getSoundVolume() * 0.9, 0.9);

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
      await initializeAudioOnInteraction();
      const loop = async () => {
        if (!active) return;
        await scheduleCycle();
        timer = window.setTimeout(loop, 2200);
      };
      loop();
    },
    stop: () => {
      active = false;
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
