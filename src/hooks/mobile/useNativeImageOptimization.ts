import { useCallback } from 'react';
const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;
import { useToast } from '@/hooks/use-toast';

interface OptimizationOptions {
  quality?: number; // 0-100, default 80
  maxWidth?: number; // default 1920
  maxHeight?: number; // default 1920
  format?: 'jpeg' | 'webp'; // default webp on native
}

interface OptimizedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export const useNativeImageOptimization = () => {
  const { toast } = useToast();
  const isNative = isNativePlatform();

  /**
   * Optimize a single image file
   */
  const optimizeImage = useCallback(async (
    file: File,
    options: OptimizationOptions = {}
  ): Promise<OptimizedImage> => {
    const {
      quality = 80,
      maxWidth = 1920,
      maxHeight = 1920,
      format = isNative ? 'webp' : 'jpeg'
    } = options;

    try {
      // Create canvas for resizing
      const img = await createImageElement(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b!),
          mimeType,
          quality / 100
        );
      });

      const optimizedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, `.${format}`),
        { type: mimeType }
      );

      return {
        file: optimizedFile,
        originalSize: file.size,
        compressedSize: optimizedFile.size,
        compressionRatio: Math.round((1 - optimizedFile.size / file.size) * 100)
      };
    } catch (error) {
      console.error('Error optimizing image:', error);
      // Return original file on error
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0
      };
    }
  }, [isNative]);

  /**
   * Optimize multiple images in parallel
   */
  const optimizeImages = useCallback(async (
    files: File[],
    options: OptimizationOptions = {}
  ): Promise<OptimizedImage[]> => {
    const results = await Promise.all(
      files.map(file => optimizeImage(file, options))
    );

    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const averageRatio = Math.round((1 - totalCompressed / totalOriginal) * 100);

    if (averageRatio > 0) {
      toast({
        title: "Images optimized",
        description: `Reduced size by ${averageRatio}% (${formatBytes(totalOriginal)} → ${formatBytes(totalCompressed)})`,
      });
    }

    return results;
  }, [optimizeImage, toast]);

  /**
   * Cache image to device filesystem (native only)
   */
  const cacheImage = useCallback(async (
    file: File,
    cacheKey: string
  ): Promise<string | null> => {
    if (!isNative) return null;

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const base64Data = await fileToBase64(file);
      const result = await Filesystem.writeFile({
        path: `image_cache/${cacheKey}`,
        data: base64Data,
        directory: Directory.Cache
      });

      return result.uri;
    } catch (error) {
      console.error('Error caching image:', error);
      return null;
    }
  }, [isNative]);

  /**
   * Get cached image (native only)
   */
  const getCachedImage = useCallback(async (
    cacheKey: string
  ): Promise<File | null> => {
    if (!isNative) return null;

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const result = await Filesystem.readFile({
        path: `image_cache/${cacheKey}`,
        directory: Directory.Cache
      });

      const blob = base64ToBlob(result.data as string);
      return new File([blob], cacheKey, { type: 'image/jpeg' });
    } catch (error) {
      return null;
    }
  }, [isNative]);

  /**
   * Clear image cache (native only)
   */
  const clearCache = useCallback(async (): Promise<void> => {
    if (!isNative) return;

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      await Filesystem.rmdir({
        path: 'image_cache',
        directory: Directory.Cache,
        recursive: true
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [isNative]);

  return {
    optimizeImage,
    optimizeImages,
    cacheImage,
    getCachedImage,
    clearCache,
    isNative
  };
};

// Helper functions
const createImageElement = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const base64ToBlob = (base64: string, mimeType = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
