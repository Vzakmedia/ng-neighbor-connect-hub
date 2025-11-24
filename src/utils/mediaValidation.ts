import { SECURITY_LIMITS, ALLOWED_FILE_TYPES } from './constants';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateMedia = (file: File): ValidationResult => {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  // Check file type
  if (isVideo && !ALLOWED_FILE_TYPES.VIDEOS.includes(file.type as any)) {
    return { 
      valid: false, 
      error: `Invalid video format. Accepted: ${ALLOWED_FILE_TYPES.VIDEOS.join(', ')}` 
    };
  }

  if (isImage && !ALLOWED_FILE_TYPES.IMAGES.includes(file.type as any)) {
    return { 
      valid: false, 
      error: `Invalid image format. Accepted: ${ALLOWED_FILE_TYPES.IMAGES.join(', ')}` 
    };
  }

  // Check file size
  const maxSize = isVideo ? SECURITY_LIMITS.MAX_VIDEO_SIZE : SECURITY_LIMITS.MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { 
      valid: false, 
      error: `File too large. Maximum ${maxSizeMB}MB for ${isVideo ? 'videos' : 'images'}` 
    };
  }

  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const estimateUploadTime = (fileSize: number, connectionType: string = 'wifi'): number => {
  // Estimated speeds in bytes per second
  const speeds: Record<string, number> = {
    'cellular': 1 * 1024 * 1024, // 1 MB/s
    'wifi': 5 * 1024 * 1024, // 5 MB/s
    '4g': 2 * 1024 * 1024, // 2 MB/s
    '5g': 10 * 1024 * 1024, // 10 MB/s
  };

  const speed = speeds[connectionType] || speeds.wifi;
  return Math.ceil(fileSize / speed); // seconds
};

export const getMediaType = (file: File): 'image' | 'video' | 'file' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
};

export const generateVideoThumbnail = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      // Seek to 2 seconds or 10% of video duration
      video.currentTime = Math.min(2, video.duration * 0.1);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.7);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};
