import { useCallback } from 'react';
import { useNativePermissions } from './useNativePermissions';
import { useToast } from '@/hooks/use-toast';

// Lazy load Camera plugin to avoid synchronous import issues on native
let CameraModule: typeof import('@capacitor/camera') | null = null;

const getCameraModule = async () => {
  if (CameraModule) return CameraModule;
  
  try {
    console.log('[useNativeCamera] Loading Camera module...');
    CameraModule = await import('@capacitor/camera');
    console.log('[useNativeCamera] Camera module loaded successfully');
    return CameraModule;
  } catch (error) {
    console.error('[useNativeCamera] Failed to load Camera module:', error);
    return null;
  }
};

export const useNativeCamera = () => {
  const { requestCameraPermission, isNative } = useNativePermissions();
  const { toast } = useToast();

  const takePicture = useCallback(async (optimized = true): Promise<File | null> => {
    console.log(`[useNativeCamera] takePicture called, isNative: ${isNative}, optimized: ${optimized}`);
    
    if (!isNative) {
      console.log('[useNativeCamera] Not native platform, returning null');
      return null;
    }

    try {
      const cameraModule = await getCameraModule();
      if (!cameraModule) {
        console.error('[useNativeCamera] Camera module not available');
        toast({
          title: "Camera unavailable",
          description: "Camera functionality is not available",
          variant: "destructive",
        });
        return null;
      }
      
      const { Camera, CameraResultType, CameraSource } = cameraModule;
      
      console.log('[useNativeCamera] Requesting camera permission...');
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        console.log('[useNativeCamera] Camera permission denied');
        return null;
      }
      console.log('[useNativeCamera] Camera permission granted');

      console.log('[useNativeCamera] Taking photo...');
      const photo = await Camera.getPhoto({
        quality: optimized ? 80 : 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        width: optimized ? 1920 : undefined,
        height: optimized ? 1920 : undefined,
        correctOrientation: true,
      });

      console.log('[useNativeCamera] Photo taken, converting to file...');
      return await photoToFile(photo);
    } catch (error) {
      console.error('[useNativeCamera] Error taking picture:', error);
      toast({
        title: "Camera error",
        description: "Failed to take picture",
        variant: "destructive",
      });
      return null;
    }
  }, [isNative, requestCameraPermission, toast]);

  const recordVideo = useCallback(async (): Promise<File | null> => {
    console.log(`[useNativeCamera] recordVideo called, isNative: ${isNative}`);
    
    if (!isNative) {
      console.log('[useNativeCamera] Not native platform, returning null');
      return null;
    }

    try {
      const cameraModule = await getCameraModule();
      if (!cameraModule) {
        console.error('[useNativeCamera] Camera module not available');
        toast({
          title: "Camera unavailable",
          description: "Camera functionality is not available",
          variant: "destructive",
        });
        return null;
      }
      
      const { Camera, CameraResultType, CameraSource } = cameraModule;
      
      console.log('[useNativeCamera] Requesting camera permission for video...');
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        console.log('[useNativeCamera] Camera permission denied');
        return null;
      }

      console.log('[useNativeCamera] Recording video...');
      const result = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!result.webPath) {
        console.log('[useNativeCamera] No webPath in result');
        return null;
      }

      console.log('[useNativeCamera] Fetching video blob...');
      const response = await fetch(result.webPath);
      const blob = await response.blob();
      
      // Check if it's actually a video
      if (blob.type.startsWith('video/')) {
        const fileName = `video_${Date.now()}.mp4`;
        console.log(`[useNativeCamera] Video captured: ${fileName}, size: ${blob.size}`);
        return new File([blob], fileName, { type: blob.type });
      }
      
      console.log('[useNativeCamera] Result is not a video, converting as photo');
      return await photoToFile(result);
    } catch (error) {
      console.error('[useNativeCamera] Error with camera:', error);
      toast({
        title: "Camera error",
        description: "Failed to capture media",
        variant: "destructive",
      });
      return null;
    }
  }, [isNative, requestCameraPermission, toast]);

  const pickImages = useCallback(async (multiple = true, optimized = true): Promise<File[]> => {
    console.log(`[useNativeCamera] pickImages called, isNative: ${isNative}, multiple: ${multiple}`);
    
    if (!isNative) {
      // Web fallback - return empty array, let file input handle it
      console.log('[useNativeCamera] Not native platform, returning empty array');
      return [];
    }

    try {
      const cameraModule = await getCameraModule();
      if (!cameraModule) {
        console.error('[useNativeCamera] Camera module not available');
        toast({
          title: "Photo picker unavailable",
          description: "Photo picker functionality is not available",
          variant: "destructive",
        });
        return [];
      }
      
      const { Camera, CameraResultType, CameraSource } = cameraModule;
      
      console.log('[useNativeCamera] Requesting photo library permission...');
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        console.log('[useNativeCamera] Photo library permission denied');
        return [];
      }

      console.log('[useNativeCamera] Opening photo picker...');
      const photo = await Camera.getPhoto({
        quality: optimized ? 80 : 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        width: optimized ? 1920 : undefined,
        height: optimized ? 1920 : undefined,
        correctOrientation: true,
      });

      console.log('[useNativeCamera] Photo selected, converting to file...');
      const file = await photoToFile(photo);
      return file ? [file] : [];
    } catch (error) {
      console.error('[useNativeCamera] Error picking images:', error);
      toast({
        title: "Photo picker error",
        description: "Failed to select photos",
        variant: "destructive",
      });
      return [];
    }
  }, [isNative, requestCameraPermission, toast]);

  const photoToFile = async (photo: any): Promise<File | null> => {
    try {
      if (!photo.webPath) {
        console.log('[useNativeCamera] photoToFile: No webPath');
        return null;
      }

      console.log(`[useNativeCamera] photoToFile: Fetching ${photo.webPath}`);
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const fileName = `photo_${Date.now()}.${photo.format || 'jpg'}`;
      const file = new File([blob], fileName, { type: `image/${photo.format || 'jpeg'}` });
      console.log(`[useNativeCamera] photoToFile: Created file ${fileName}, size: ${file.size}`);
      return file;
    } catch (error) {
      console.error('[useNativeCamera] Error converting photo to file:', error);
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
