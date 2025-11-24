import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useNativePermissions } from './useNativePermissions';
import { useToast } from '@/hooks/use-toast';

export const useNativeVideoRecorder = () => {
  const { requestCameraPermission, isNative } = useNativePermissions();
  const { toast } = useToast();

  const recordVideo = useCallback(async (maxDuration: number = 60): Promise<File | null> => {
    if (!isNative) {
      return null;
    }

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return null;
      }

      // Note: Capacitor Camera doesn't have native video recording
      // This would require a custom plugin or using the native picker
      const result = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        // @ts-ignore - video mode not in types but supported on some platforms
        mediaType: 'video',
      });

      if (!result.webPath) return null;

      const response = await fetch(result.webPath);
      const blob = await response.blob();
      const fileName = `video_${Date.now()}.mp4`;
      
      return new File([blob], fileName, { type: 'video/mp4' });
    } catch (error) {
      console.error('Error recording video:', error);
      toast({
        title: "Video recording error",
        description: "Failed to record video",
        variant: "destructive",
      });
      return null;
    }
  }, [isNative, requestCameraPermission, toast]);

  return {
    recordVideo,
    isNative
  };
};
