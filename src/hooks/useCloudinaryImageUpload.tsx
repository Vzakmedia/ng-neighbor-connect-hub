import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '@/services/cloudinaryService';

interface UploadProgress {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export const useCloudinaryImageUpload = (folder: string = 'promotions') => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return [];
    }

    setIsUploading(true);
    const uploadPromises: UploadProgress[] = files.map(file => ({
      file,
      progress: 0
    }));
    
    setUploads(uploadPromises);

    try {
      const uploadedUrls: string[] = [];
      const userFolder = `${folder}/${user.id}`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const url = await uploadToCloudinary(
          file,
          userFolder,
          (progress) => {
            setUploads(prev => prev.map((upload, index) => 
              index === i ? { ...upload, progress } : upload
            ));
          }
        );

        if (url) {
          uploadedUrls.push(url);
          setUploads(prev => prev.map((upload, index) => 
            index === i ? { ...upload, progress: 100, url } : upload
          ));
        } else {
          setUploads(prev => prev.map((upload, index) => 
            index === i ? { ...upload, error: 'Upload failed', progress: 0 } : upload
          ));
        }
      }

      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      });

      return uploadedUrls;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploads([]), 3000);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const publicId = extractPublicId(imageUrl);
      if (!publicId) {
        throw new Error('Invalid Cloudinary URL');
      }

      const success = await deleteFromCloudinary(publicId);

      if (success) {
        toast({
          title: "Success",
          description: "Image deleted successfully",
        });
        return true;
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadImages,
    deleteImage,
    uploads,
    isUploading
  };
};
