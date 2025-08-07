import { NOTIFICATION_SOUNDS, NotificationSoundType, generateNotificationSound, getSoundVolume } from './audioUtils';

// Test a specific notification sound
export const testNotificationSound = async (soundType: NotificationSoundType, volume?: number): Promise<void> => {
  try {
    const testVolume = volume !== undefined ? volume : getSoundVolume();
    
    if (soundType === 'generated') {
      await generateNotificationSound(testVolume);
      return;
    }
    
    const soundConfig = NOTIFICATION_SOUNDS[soundType];
    if (!soundConfig.file) {
      console.error('No file found for sound type:', soundType);
      return;
    }
    
    const audio = new Audio(soundConfig.file);
    audio.volume = Math.min(testVolume, 1.0);
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise;
    }
    
    console.log(`Test played for ${soundConfig.name}`);
  } catch (error) {
    console.error(`Error testing ${soundType} notification sound:`, error);
  }
};

// Get all available notification sounds for UI display
export const getAvailableNotificationSounds = () => {
  return Object.entries(NOTIFICATION_SOUNDS).map(([key, config]) => ({
    id: key as NotificationSoundType,
    name: config.name,
    hasFile: !!config.file
  }));
};