// Audio Context for sound generation
let audioContext: AudioContext | null = null;

// Initialize audio context
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Generate a pleasant notification sound
export const generateNotificationSound = (volume: number = 0.5): void => {
  const ctx = getAudioContext();
  
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
export const generateEmergencySound = (volume: number = 0.7): void => {
  const ctx = getAudioContext();
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
export const playNotification = (type: 'normal' | 'emergency', volume: number): void => {
  try {
    if (type === 'emergency') {
      generateEmergencySound(volume);
    } else {
      generateNotificationSound(volume);
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Fallback to system notification if available
    if ('Notification' in window) {
      new Notification('Test notification', { silent: false });
    }
  }
};