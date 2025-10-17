import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary } from '@/services/cloudinaryService';

export interface CloudinaryAttachment {
  id: string;
  type: 'image' | 'video' | 'file';
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export const useCloudinaryUpload = (userId: string, folder: string = 'chat-attachments') => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File): Promise<CloudinaryAttachment | null> => {
    try {
      setUploading(true);
      setProgress(0);
      
      const userFolder = `${folder}/${userId}`;
      const url = await uploadToCloudinary(file, userFolder, setProgress);

      if (!url) throw new Error('Upload failed');

      // Determine file type
      let fileType: 'image' | 'video' | 'file' = 'file';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      }

      const attachment: CloudinaryAttachment = {
        id: url,
        type: fileType,
        name: file.name,
        url,
        size: file.size,
        mimeType: file.type
      };

      return attachment;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [userId, folder, toast]);

  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<CloudinaryAttachment[]> => {
    const attachments: CloudinaryAttachment[] = [];
    
    for (const file of files) {
      const attachment = await uploadFile(file);
      if (attachment) {
        attachments.push(attachment);
      }
    }
    
    return attachments;
  }, [uploadFile]);

  return {
    uploading,
    progress,
    uploadFile,
    uploadMultipleFiles
  };
};
