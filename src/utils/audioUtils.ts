// Audio Context for sound generation
let audioContext: AudioContext | null = null;

// Initialize audio context
const getAudioContext = async (): Promise<AudioContext> => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume audio context if suspended (required for modern browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  }
  return audioContext;
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

// Check if user has enabled sound in settings
export const isSoundEnabled = (): boolean => {
  try {
    const audioSettings = localStorage.getItem('audioSettings');
    if (audioSettings) {
      const settings = JSON.parse(audioSettings);
      return settings.soundEnabled === true;
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

// Enhanced play notification with permission and settings check
export const playNotification = async (type: 'normal' | 'emergency' | 'notification', customVolume?: number): Promise<void> => {
  try {
    console.log('playNotification called with type:', type, 'customVolume:', customVolume);
    
    // Check if notifications are allowed
    const hasNotificationPermission = await checkNotificationPermission();
    if (!hasNotificationPermission) {
      console.log('Notification permission not granted, skipping sound');
      return;
    }

    // Check if sound is enabled in user settings
    if (!isSoundEnabled()) {
      console.log('Sound disabled in user settings, skipping sound');
      return;
    }

    // Get volume from settings or use custom volume
    const volume = customVolume !== undefined ? customVolume : getSoundVolume();
    
    if (type === 'emergency') {
      await generateEmergencySound(volume);
    } else {
      await generateNotificationSound(volume);
    }
    
    console.log('Notification sound played successfully');
  } catch (error) {
    console.error('Error playing notification sound:', error);
    
    // Try to use the existing notification.mp3 file as fallback
    try {
      const audio = new Audio('/notification.mp3');
      const volume = customVolume !== undefined ? customVolume : getSoundVolume();
      audio.volume = volume;
      await audio.play();
      console.log('Fallback audio file played');
    } catch (fallbackError) {
      console.error('Fallback audio also failed:', fallbackError);
      
      // Final fallback to system notification (but only if user has enabled sounds)
      if ('Notification' in window && isSoundEnabled()) {
        new Notification('New alert', { silent: false });
      }
    }
  }
};

// Play emergency alert sound specifically for critical alerts
export const playEmergencyAlert = async (): Promise<void> => {
  try {
    console.log('Playing emergency alert sound');
    
    // Check permissions and settings
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission || !isSoundEnabled()) {
      console.log('Cannot play emergency alert - permissions or settings');
      return;
    }

    // Play emergency sound at high volume for emergencies
    const volume = Math.min(getSoundVolume() * 1.5, 1.0); // Boost volume for emergencies but cap at 1.0
    await generateEmergencySound(volume);
    
    // Also show a browser notification for emergencies
    if ('Notification' in window) {
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