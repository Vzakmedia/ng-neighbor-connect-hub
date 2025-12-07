export type SoundAssetId = 'notification' | 'message-chime' | 'emergency' | 'ringtone';

interface PreloadedSound {
  assetId: SoundAssetId;
  assetPath: string;
  isLoaded: boolean;
}

const SOUND_ASSETS: Record<SoundAssetId, string> = {
  'notification': 'assets/sounds/notification.mp3',
  'message-chime': 'assets/sounds/message-chime.mp3',
  'emergency': 'assets/sounds/emergency.mp3',
  'ringtone': 'assets/sounds/ringtone.mp3'
};

class NativeAudioManager {
  private isNative: boolean | null = null;
  private preloadedSounds: Map<SoundAssetId, boolean> = new Map();
  private isInitialized: boolean = false;

  private checkIsNative(): boolean {
    if (this.isNative === null) {
      this.isNative = (window as any).Capacitor?.isNativePlatform?.() === true;
    }
    return this.isNative;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.checkIsNative()) return;

    try {
      console.log('NativeAudioManager: Initializing...');
      
      const { NativeAudio } = await import('@capgo/native-audio');
      
      // Preload all sound assets
      const preloadPromises = Object.entries(SOUND_ASSETS).map(async ([assetId, assetPath]) => {
        try {
          await NativeAudio.preload({
            assetId: assetId as SoundAssetId,
            assetPath: assetPath,
            audioChannelNum: 1,
            isUrl: false
          });
          this.preloadedSounds.set(assetId as SoundAssetId, true);
          console.log(`NativeAudioManager: Preloaded ${assetId}`);
        } catch (error) {
          console.error(`NativeAudioManager: Failed to preload ${assetId}:`, error);
          this.preloadedSounds.set(assetId as SoundAssetId, false);
        }
      });

      await Promise.all(preloadPromises);
      this.isInitialized = true;
      console.log('NativeAudioManager: Initialization complete');
    } catch (error) {
      console.error('NativeAudioManager: Initialization failed:', error);
    }
  }

  async play(assetId: SoundAssetId, volume: number = 1.0): Promise<boolean> {
    if (!this.checkIsNative()) {
      console.log('NativeAudioManager: Not on native platform, skipping');
      return false;
    }

    if (!this.preloadedSounds.get(assetId)) {
      console.warn(`NativeAudioManager: Sound ${assetId} not preloaded`);
      return false;
    }

    try {
      const { NativeAudio } = await import('@capgo/native-audio');
      
      await NativeAudio.play({
        assetId,
        time: 0.0
      });
      
      // Set volume if supported
      if (volume !== 1.0) {
        await NativeAudio.setVolume({
          assetId,
          volume: Math.max(0, Math.min(1, volume))
        }).catch(() => {
          // Volume control might not be supported on all platforms
          console.warn('NativeAudioManager: Volume control not supported');
        });
      }

      console.log(`NativeAudioManager: Played ${assetId} at volume ${volume}`);
      return true;
    } catch (error) {
      console.error(`NativeAudioManager: Failed to play ${assetId}:`, error);
      return false;
    }
  }

  async loop(assetId: SoundAssetId, volume: number = 1.0): Promise<boolean> {
    if (!this.checkIsNative()) return false;

    if (!this.preloadedSounds.get(assetId)) {
      console.warn(`NativeAudioManager: Sound ${assetId} not preloaded`);
      return false;
    }

    try {
      const { NativeAudio } = await import('@capgo/native-audio');
      
      await NativeAudio.loop({
        assetId
      });

      if (volume !== 1.0) {
        await NativeAudio.setVolume({
          assetId,
          volume: Math.max(0, Math.min(1, volume))
        }).catch(() => {});
      }

      console.log(`NativeAudioManager: Looping ${assetId}`);
      return true;
    } catch (error) {
      console.error(`NativeAudioManager: Failed to loop ${assetId}:`, error);
      return false;
    }
  }

  async stop(assetId: SoundAssetId): Promise<void> {
    if (!this.checkIsNative()) return;

    try {
      const { NativeAudio } = await import('@capgo/native-audio');
      
      await NativeAudio.stop({
        assetId
      });
      console.log(`NativeAudioManager: Stopped ${assetId}`);
    } catch (error) {
      console.error(`NativeAudioManager: Failed to stop ${assetId}:`, error);
    }
  }

  async unload(assetId: SoundAssetId): Promise<void> {
    if (!this.checkIsNative()) return;

    try {
      const { NativeAudio } = await import('@capgo/native-audio');
      
      await NativeAudio.unload({
        assetId
      });
      this.preloadedSounds.delete(assetId);
      console.log(`NativeAudioManager: Unloaded ${assetId}`);
    } catch (error) {
      console.error(`NativeAudioManager: Failed to unload ${assetId}:`, error);
    }
  }

  isNativePlatform(): boolean {
    return this.checkIsNative();
  }

  isSoundLoaded(assetId: SoundAssetId): boolean {
    return this.preloadedSounds.get(assetId) === true;
  }
}

// Singleton instance
export const nativeAudioManager = new NativeAudioManager();
