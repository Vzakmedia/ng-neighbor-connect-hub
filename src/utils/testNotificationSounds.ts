import { NOTIFICATION_SOUNDS, NotificationSoundType, generateNotificationSound, getSoundVolume, initializeAudioOnInteraction } from './audioUtils';

// Test a specific notification sound
export const testNotificationSound = async (soundType: NotificationSoundType, volume?: number): Promise<void> => {
  try {
    console.log('Testing notification sound:', soundType, 'volume:', volume);
    
    // Ensure audio is initialized first (critical for mobile and modern browsers)
    await initializeAudioOnInteraction();
    
    const testVolume = volume !== undefined ? volume : await getSoundVolume();
    console.log('Using volume:', testVolume);
    
    if (soundType === 'generated') {
      console.log('Playing generated notification sound');
      await generateNotificationSound(testVolume);
      console.log('Generated sound played successfully');
      return;
    }
    
    const soundConfig = NOTIFICATION_SOUNDS[soundType];
    if (!soundConfig.file) {
      console.error('No file found for sound type:', soundType);
      return;
    }
    
    console.log('Playing audio file:', soundConfig.file);
    const audio = new Audio(soundConfig.file);
    audio.volume = Math.min(testVolume, 1.0);
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    
    // Add error event listeners
    audio.addEventListener('error', (e) => {
      console.error('Audio file loading error:', e);
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.log('Audio file loaded and ready to play');
    });
    
    // Wait a moment for the audio to load
    await new Promise(resolve => {
      if (audio.readyState >= 3) {
        resolve(true);
      } else {
        audio.addEventListener('canplaythrough', () => resolve(true), { once: true });
        // Timeout after 3 seconds
        setTimeout(() => resolve(true), 3000);
      }
    });
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise;
      console.log(`Test played successfully for ${soundConfig.name}`);
    }
    
  } catch (error) {
    console.error(`Error testing ${soundType} notification sound:`, error);
    
    // Fallback to generated sound if file fails
    if (soundType !== 'generated') {
      console.log('Falling back to generated sound');
      try {
        const fallbackVolume = volume || await getSoundVolume();
        await generateNotificationSound(fallbackVolume);
        console.log('Fallback generated sound played');
      } catch (fallbackError) {
        console.error('Fallback generated sound also failed:', fallbackError);
      }
    }
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