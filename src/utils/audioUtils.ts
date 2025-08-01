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

// Play notification with specified type and volume
export const playNotification = async (type: 'normal' | 'emergency' | 'notification', volume: number): Promise<void> => {
  try {
    console.log('playNotification: Called with type:', type, 'volume:', volume);
    
    // Request audio permission first
    try {
      const audioContext = await getAudioContext();
      console.log('playNotification: AudioContext state:', audioContext.state);
      if (audioContext.state === 'suspended') {
        console.log('playNotification: Resuming suspended AudioContext...');
        await audioContext.resume();
        console.log('playNotification: AudioContext resumed, new state:', audioContext.state);
      }
    } catch (permissionError) {
      console.warn('playNotification: Audio context permission issue:', permissionError);
    }
    
    console.log('playNotification: Attempting to generate sound...');
    // Play the appropriate sound
    if (type === 'emergency') {
      await generateEmergencySound(volume);
    } else {
      await generateNotificationSound(volume);
    }
    
    console.log('playNotification: Notification sound played successfully');
  } catch (error) {
    console.error('playNotification: Error playing notification sound:', error);
    
    // Try to use the existing notification.mp3 file as fallback
    try {
      console.log('playNotification: Attempting fallback audio file...');
      const audio = new Audio('/notification.mp3');
      audio.volume = Math.min(volume, 1.0); // Ensure volume is within valid range
      console.log('playNotification: Audio element created, attempting to play...');
      
      // Handle audio loading and playing
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('playNotification: Fallback audio file played successfully');
      }
    } catch (fallbackError) {
      console.error('playNotification: Fallback audio also failed:', fallbackError);
      
      // Final fallback - try system notification if available
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Message', { 
            body: 'You have a new message',
            icon: '/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png',
            silent: false 
          });
          console.log('System notification displayed');
        } else if ('Notification' in window && Notification.permission === 'default') {
          // Request notification permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification('New Message', { 
              body: 'You have a new message',
              icon: '/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png',
              silent: false 
            });
            console.log('System notification displayed after permission granted');
          }
        }
      } catch (notificationError) {
        console.error('System notification also failed:', notificationError);
      }
    }
  }
};

// Initialize audio system on user interaction
export const initializeAudioSystem = async (): Promise<boolean> => {
  try {
    const audioContext = await getAudioContext();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Test audio capabilities
    await generateNotificationSound(0.1); // Very quiet test
    console.log('Audio system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize audio system:', error);
    return false;
  }
};