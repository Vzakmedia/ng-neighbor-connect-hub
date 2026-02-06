import { invokeEdgeFunction, checkIsNativePlatform } from '@/utils/nativeEdgeFunctions';



interface UploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  folder: string;
  resource_type?: string;
}

export const getUploadSignature = async (
  folder: string,
  resourceType?: 'image' | 'video' | 'auto'
): Promise<UploadSignature | null> => {
  const timestamp = Date.now();
  const isNative = checkIsNativePlatform();

  console.log(`[CloudinaryService] getUploadSignature started, timestamp: ${timestamp}`);
  console.log(`[CloudinaryService] Platform: ${isNative ? 'native' : 'web'}, folder: ${folder}, resourceType: ${resourceType}`);

  try {
    const { data, error } = await invokeEdgeFunction<UploadSignature>('generate-cloudinary-signature', {
      body: { folder, resource_type: resourceType || 'auto' }
    });

    if (error) {
      console.error('[CloudinaryService] Failed to get signature:', error);
      throw error;
    }

    if (!data || !data.signature) {
      console.error('[CloudinaryService] Invalid signature response:', data);
      throw new Error('Invalid signature response from server');
    }

    console.log('[CloudinaryService] Successfully received upload signature');
    return data;
  } catch (error: any) {
    console.error('[CloudinaryService] getUploadSignature error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });

    if (error?.message?.includes('sign in') || error?.message?.includes('Authentication')) {
      throw error;
    }
    throw new Error('Unable to connect to upload service. Please check your connection and try again.');
  }
};

// Lazy load env variable to avoid initialization timing issues
const getCloudName = () => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  // Handle case where .env might have quotes
  return cloudName ? cloudName.replace(/['"]/g, '') : undefined;
};

export const uploadToCloudinary = async (
  file: File,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  const uploadTimestamp = Date.now();
  const isNative = checkIsNativePlatform();
  const cloudName = getCloudName();

  console.log(`[CloudinaryService] uploadToCloudinary started, timestamp: ${uploadTimestamp}`);
  console.log(`[CloudinaryService] File: ${file.name}, size: ${file.size}, type: ${file.type}`);
  console.log(`[CloudinaryService] Platform: ${isNative ? 'native' : 'web'}, folder: ${folder}`);
  console.log(`[CloudinaryService] Cloud Name available: ${!!cloudName} (${cloudName})`);

  try {
    if (!cloudName) {
      console.error('[CloudinaryService] Env vars available:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
      throw new Error('Cloudinary is not configured. Please check your environment variables (VITE_CLOUDINARY_CLOUD_NAME).');
    }

    // Determine resource type
    const resourceType: 'image' | 'video' | 'auto' = file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('image/')
        ? 'image'
        : 'auto';

    console.log(`[CloudinaryService] Resource type determined: ${resourceType}`);
    console.log(`[CloudinaryService] Getting upload signature...`);

    const signatureData = await getUploadSignature(folder, resourceType);
    if (!signatureData) {
      throw new Error('Failed to get upload signature');
    }

    console.log(`[CloudinaryService] Signature received, preparing upload...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signatureData.signature);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('api_key', signatureData.api_key);
    formData.append('folder', folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    console.log(`[CloudinaryService] Upload URL: ${uploadUrl}`);

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          console.log(`[CloudinaryService] Upload progress: ${progress}% (${e.loaded}/${e.total})`);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        const elapsed = Date.now() - uploadTimestamp;
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log(`[CloudinaryService] Upload successful in ${elapsed}ms:`, response.secure_url);
          resolve(response.secure_url);
        } else {
          console.error(`[CloudinaryService] Upload failed: status=${xhr.status}, response=${xhr.responseText}`);
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', (e) => {
        console.error('[CloudinaryService] Upload network error:', e);
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        console.error('[CloudinaryService] Upload timeout');
        reject(new Error('Upload timeout - file may be too large'));
      });

      // Set timeout to 10 minutes for large video uploads
      xhr.timeout = 10 * 60 * 1000;

      console.log(`[CloudinaryService] Starting XHR upload...`);
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('[CloudinaryService] uploadToCloudinary error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  console.log(`[CloudinaryService] deleteFromCloudinary: ${publicId}`);

  try {
    const { data, error } = await invokeEdgeFunction<{ success: boolean }>('delete-cloudinary-image', {
      body: { publicId }
    });

    if (error) {
      console.error('[CloudinaryService] Delete error:', error);
      return false;
    }

    console.log('[CloudinaryService] Delete result:', data?.success);
    return data?.success || false;
  } catch (error) {
    console.error('[CloudinaryService] deleteFromCloudinary error:', error);
    return false;
  }
};

export const getCloudinaryUrl = (
  publicId: string,
  resourceType: 'image' | 'video' = 'image',
  transformations?: string
): string => {
  if (!publicId) return '';
  const cloudName = getCloudName();
  if (!cloudName) return '';

  const baseUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload`;
  return transformations ? `${baseUrl}/${transformations}/${publicId}` : `${baseUrl}/${publicId}`;
};

// Common transformation presets
export const transformations = {
  avatar: 'w_400,h_400,c_fill,g_face,f_auto,q_auto',
  avatarThumb: 'w_200,h_200,c_fill,g_face,f_auto,q_auto',
  postImage: 'w_1200,c_limit,f_auto,q_auto',
  postThumb: 'w_400,h_300,c_fill,f_auto,q_auto',
  serviceGallery: 'w_800,h_600,c_fill,f_auto,q_auto',
  serviceThumb: 'w_300,h_200,c_fill,f_auto,q_auto',
  eventBanner: 'w_1200,h_400,c_fill,f_auto,q_auto',
};

// Video transformation presets
export const videoTransformations = {
  thumbnail: 'so_2.0,w_1280,h_720,c_fill,f_auto,q_auto',
  preview: 'so_2.0,w_800,h_600,c_fill,f_auto,q_auto',
  compressed: 'q_auto:low,vc_h264',
  hd: 'q_auto:good,vc_h264,w_1920',
};

export const extractPublicId = (url: string): string | null => {
  try {
    const cloudName = getCloudName();
    if (!cloudName) return null;

    // Handle both image and video URLs
    const pattern = new RegExp(`https://res\\.cloudinary\\.com/${cloudName}/(image|video)/upload/(?:v\\d+/)?(.+)`);
    const match = url.match(pattern);
    return match ? match[2] : null;
  } catch {
    return null;
  }
};

export const getVideoThumbnailUrl = (videoUrl: string): string => {
  // Generate video thumbnail using Cloudinary's automatic thumbnail
  // Must change extension to .jpg to get an image frame from the video
  return videoUrl
    .replace('/video/upload/', `/video/upload/${videoTransformations.thumbnail}/`)
    .replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.jpg');
};
