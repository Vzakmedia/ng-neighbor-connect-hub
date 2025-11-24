import { supabase } from '@/integrations/supabase/client';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

if (!CLOUDINARY_CLOUD_NAME) {
  console.error('CLOUDINARY_CLOUD_NAME is not configured. Image uploads will fail.');
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  folder: string;
}

export const getUploadSignature = async (folder: string): Promise<UploadSignature | null> => {
  try {
    console.log('Requesting upload signature for folder:', folder);
    const { data, error } = await supabase.functions.invoke('generate-cloudinary-signature', {
      body: { folder }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }
    
    if (!data || !data.signature) {
      throw new Error('Invalid signature response from server');
    }
    
    console.log('Successfully received upload signature');
    return data;
  } catch (error) {
    console.error('Error getting upload signature:', error);
    throw error; // Propagate error instead of silently returning null
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
    
    const signatureData = await getUploadSignature(folder);
    if (!signatureData) throw new Error('Failed to get upload signature');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signatureData.signature);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('api_key', signatureData.api_key);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

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
      
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error; // Propagate error instead of returning null
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

export const getCloudinaryUrl = (publicId: string, transformations?: string): string => {
  if (!publicId) return '';
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
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

export const extractPublicId = (url: string): string | null => {
  try {
    const urlPattern = new RegExp(`https://res\\.cloudinary\\.com/${CLOUDINARY_CLOUD_NAME}/image/upload/(?:v\\d+/)?(.+)`);
    const match = url.match(urlPattern);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};
