import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { useNativePermissions } from './useNativePermissions';
import { useToast } from '@/hooks/use-toast';

export const useNativeCamera = () => {
  const { requestCameraPermission, isNative } = useNativePermissions();
  const { toast } = useToast();

  const takePicture = useCallback(async (optimized = true): Promise<File | null> => {
    if (!isNative) {
      return null;
    }

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return null;
      }

      const photo = await Camera.getPhoto({
        quality: optimized ? 80 : 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        width: optimized ? 1920 : undefined,
        height: optimized ? 1920 : undefined,
        correctOrientation: true,
      });

      return await photoToFile(photo);
    } catch (error) {
      console.error('Error taking picture:', error);
      toast({
        title: "Camera error",
        description: "Failed to take picture",
        variant: "destructive",
      });
      return null;
    }
  }, [isNative, requestCameraPermission, toast]);

  const recordVideo = useCallback(async (): Promise<File | null> => {
    if (!isNative) {
      return null;
    }

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return null;
      }

      // Note: Using camera with video mode (platform-dependent)
      const result = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!result.webPath) return null;

      const response = await fetch(result.webPath);
      const blob = await response.blob();
      
      // Check if it's actually a video
      if (blob.type.startsWith('video/')) {
        const fileName = `video_${Date.now()}.mp4`;
        return new File([blob], fileName, { type: blob.type });
      }
      
      return await photoToFile(result);
    } catch (error) {
      console.error('Error with camera:', error);
      toast({
        title: "Camera error",
        description: "Failed to capture media",
        variant: "destructive",
      });
      return null;
    }
  }, [isNative, requestCameraPermission, toast]);

  const pickImages = useCallback(async (multiple = true, optimized = true): Promise<File[]> => {
    if (!isNative) {
      // Web fallback - return empty array, let file input handle it
      return [];
    }

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return [];
      }

      const photo = await Camera.getPhoto({
        quality: optimized ? 80 : 90, // Use 80% quality for optimized images
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        width: optimized ? 1920 : undefined, // Max 1920px width
        height: optimized ? 1920 : undefined, // Max 1920px height
        correctOrientation: true, // Fix rotation issues
      });

      const file = await photoToFile(photo);
      return file ? [file] : [];
    } catch (error) {
      console.error('Error picking images:', error);
      toast({
        title: "Photo picker error",
        description: "Failed to select photos",
        variant: "destructive",
      });
      return [];
    }
  }, [isNative, requestCameraPermission, toast]);

  const photoToFile = async (photo: Photo): Promise<File | null> => {
    try {
      if (!photo.webPath) return null;

      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const fileName = `photo_${Date.now()}.${photo.format || 'jpg'}`;
      return new File([blob], fileName, { type: `image/${photo.format || 'jpeg'}` });
    } catch (error) {
      console.error('Error converting photo to file:', error);
      return null;
    }
  };

  return {
    takePicture,
    pickImages,
    recordVideo,
    isNative
  };
};
