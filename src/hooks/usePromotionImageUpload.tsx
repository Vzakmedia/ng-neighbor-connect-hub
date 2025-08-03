import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UploadProgress {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export const usePromotionImageUpload = () => {
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

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Update progress
        setUploads(prev => prev.map((upload, index) => 
          index === i ? { ...upload, progress: 50 } : upload
        ));

        const { data, error } = await supabase.storage
          .from('promotion-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          setUploads(prev => prev.map((upload, index) => 
            index === i ? { ...upload, error: error.message, progress: 0 } : upload
          ));
          console.error('Upload error:', error);
          continue;
        }

        // Get public URL
        const { data: publicData } = supabase.storage
          .from('promotion-images')
          .getPublicUrl(data.path);

        const publicUrl = publicData.publicUrl;
        uploadedUrls.push(publicUrl);

        // Update progress to complete
        setUploads(prev => prev.map((upload, index) => 
          index === i ? { ...upload, progress: 100, url: publicUrl } : upload
        ));
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
      // Clear uploads after a delay
      setTimeout(() => setUploads([]), 3000);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const bucketPath = urlParts.slice(-2).join('/'); // user_id/filename

      const { error } = await supabase.storage
        .from('promotion-images')
        .remove([bucketPath]);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Error",
          description: "Failed to delete image",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      return true;
    } catch (error) {
      console.error('Delete error:', error);
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