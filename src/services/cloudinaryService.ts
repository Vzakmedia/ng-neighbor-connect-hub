import { supabase } from '@/integrations/supabase/client';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

if (!CLOUDINARY_CLOUD_NAME) {
  console.error('CLOUDINARY_CLOUD_NAME is not configured. Media uploads will fail.');
}

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
  try {
    // Explicitly validate access token
    let { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.log('No access token found, attempting to refresh session...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session?.access_token) {
        throw new Error('Please sign in to upload files');
      }
      
      session = refreshData.session;
    }
    
    console.log('Requesting upload signature:', {
      folder,
      resource_type: resourceType,
      hasAccessToken: !!session.access_token,
      tokenExpiresAt: session.expires_at,
      currentTime: Math.floor(Date.now() / 1000)
    });
    
    // Try with supabase.functions.invoke first
    try {
      const { data, error } = await supabase.functions.invoke('generate-cloudinary-signature', {
        body: { folder, resource_type: resourceType || 'auto' }
      });

      if (error) {
        console.error('Edge function invoke error:', error);
        throw error;
      }
      
      if (!data || !data.signature) {
        throw new Error('Invalid signature response from server');
      }
      
      console.log('Successfully received upload signature via invoke');
      return data;
    } catch (invokeError: any) {
      // Fallback to direct fetch
      console.log('Invoke failed, attempting direct fetch fallback...', invokeError.message);
      
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-cloudinary-signature`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ folder, resource_type: resourceType || 'auto' })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Direct fetch failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.signature) {
        throw new Error('Invalid signature response from server');
      }
      
      console.log('Successfully received upload signature via direct fetch');
      return data;
    }
  } catch (error: any) {
    console.error('Error getting upload signature:', {
      message: error?.message,
      name: error?.name,
      context: error?.context,
      stack: error?.stack
    });
    
    // Provide user-friendly error message
    if (error?.message?.includes('sign in')) {
      throw error; // Re-throw auth errors as-is
    }
    throw new Error('Unable to connect to upload service. Please check your connection and try again.');
  }
};

export const uploadToCloudinary = async (
  file: File,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    if (!CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary is not configured. Please check your environment variables.');
    }

    console.log('Starting upload for file:', file.name, 'to folder:', folder);
    
    // Determine resource type
    const resourceType: 'image' | 'video' | 'auto' = file.type.startsWith('video/') 
      ? 'video' 
      : file.type.startsWith('image/') 
      ? 'image' 
      : 'auto';
    
    const signatureData = await getUploadSignature(folder, resourceType);
    if (!signatureData) throw new Error('Failed to get upload signature');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signatureData.signature);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('api_key', signatureData.api_key);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          console.log(`Upload progress: ${progress}%`);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log('Upload successful:', response.secure_url);
          resolve(response.secure_url);
        } else {
          console.error('Upload failed with status:', xhr.status, xhr.responseText);
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', (e) => {
        console.error('Upload network error:', e);
        reject(new Error('Network error during upload'));
      });
      
      xhr.addEventListener('timeout', () => {
        console.error('Upload timeout');
        reject(new Error('Upload timeout - file may be too large'));
      });
      
      // Set timeout to 10 minutes for large video uploads
      xhr.timeout = 10 * 60 * 1000;
      
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('delete-cloudinary-image', {
      body: { publicId }
    });

    if (error) throw error;
    return data?.success || false;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

export const getCloudinaryUrl = (
  publicId: string, 
  resourceType: 'image' | 'video' = 'image',
  transformations?: string
): string => {
  if (!publicId) return '';
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
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
    // Handle both image and video URLs
    const pattern = new RegExp(`https://res\\.cloudinary\\.com/${CLOUDINARY_CLOUD_NAME}/(image|video)/upload/(?:v\\d+/)?(.+)`);
    const match = url.match(pattern);
    return match ? match[2] : null;
  } catch {
    return null;
  }
};

export const getVideoThumbnailUrl = (videoUrl: string): string => {
  // Generate video thumbnail using Cloudinary's automatic thumbnail
  return videoUrl.replace('/video/upload/', `/video/upload/${videoTransformations.thumbnail}/`);
};
