import { useCallback } from 'react';
import { useNativePermissions } from './useNativePermissions';
import { useToast } from '@/hooks/use-toast';

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;
const getPlatform = () => (window as any).Capacitor?.getPlatform?.() || 'web';

export const useNativeVideoRecorder = () => {
  const { requestCameraPermission, isNative } = useNativePermissions();
  const { toast } = useToast();
  const platform = getPlatform();

  /**
   * Fallback video recording using HTML5 file input
   * This is more reliable on iOS than Capacitor's Camera API for video
   */
  const recordVideoWithFallback = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.capture = 'environment';
      input.style.display = 'none';
      
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
          // iOS records as MOV, Android as MP4
          const fileName = `video_${Date.now()}.${file.type.includes('quicktime') ? 'mov' : 'mp4'}`;
          const renamedFile = new File([file], fileName, { type: file.type });
          resolve(renamedFile);
        } else {
          resolve(null);
        }
        
        document.body.removeChild(input);
      };
      
      input.oncancel = () => {
        resolve(null);
        document.body.removeChild(input);
      };
      
      document.body.appendChild(input);
      input.click();
    });
  }, []);

  const recordVideo = useCallback(async (maxDuration: number = 60): Promise<File | null> => {
    try {
      // Request camera permission first
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return null;
      }

      // iOS: Use file input fallback (most reliable)
      if (platform === 'ios' || !isNative) {
        return await recordVideoWithFallback();
      }

      // Android Native: Try Capacitor Camera first, fallback to file input
      if (platform === 'android' && isNativePlatform()) {
        try {
          const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
          const result = await Camera.getPhoto({
            quality: 80,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            // @ts-ignore - video mode not in types but supported on some platforms
            mediaType: 'video',
          });

          if (result.webPath) {
            const response = await fetch(result.webPath);
            const blob = await response.blob();
            const fileName = `video_${Date.now()}.mp4`;
            return new File([blob], fileName, { type: 'video/mp4' });
          }
        } catch (error) {
          console.warn('Capacitor Camera failed, using fallback:', error);
          return await recordVideoWithFallback();
        }
      }

      // Fallback for other platforms
      return await recordVideoWithFallback();
    } catch (error) {
      console.error('Error recording video:', error);
      toast({
        title: "Video recording error",
        description: "Failed to record video",
        variant: "destructive",
      });
      return null;
    }
  }, [isNative, platform, requestCameraPermission, recordVideoWithFallback, toast]);

  return {
    recordVideo,
    isNative
  };
};
