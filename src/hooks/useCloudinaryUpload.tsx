import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary, getVideoThumbnailUrl } from '@/services/cloudinaryService';
import { validateMedia, getMediaType } from '@/utils/mediaValidation';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export interface CloudinaryAttachment {
  id: string;
  type: 'image' | 'video' | 'file';
  name: string;
  url: string;
  thumbnailUrl?: string; // For videos
  size: number;
  mimeType: string;
  duration?: number; // For videos
}

export const useCloudinaryUpload = (userId: string, folder: string = 'chat-attachments') => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File): Promise<CloudinaryAttachment | null> => {
    try {
      // Validate file
      const validation = validateMedia(file);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return null;
      }

      // Check network type for large files
      const isNative = Capacitor.isNativePlatform();
      const isVideo = file.type.startsWith('video/');
      
      if (isNative && file.size > 20 * 1024 * 1024) {
        try {
          const status = await Network.getStatus();
          if (status.connectionType === 'cellular') {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            const shouldContinue = confirm(
              `Uploading ${sizeMB}MB over cellular data. This may use significant data. Continue?`
            );
            if (!shouldContinue) return null;
          }
        } catch (error) {
          console.log('Could not check network status:', error);
        }
      }

      setUploading(true);
      setProgress(0);
      
      const userFolder = `${folder}/${userId}`;
      const url = await uploadToCloudinary(file, userFolder, setProgress);

      if (!url) throw new Error('Upload failed');

      const fileType = getMediaType(file);
      
      const attachment: CloudinaryAttachment = {
        id: url,
        type: fileType,
        name: file.name,
        url,
        size: file.size,
        mimeType: file.type
      };

      // Add thumbnail for videos
      if (isVideo) {
        attachment.thumbnailUrl = getVideoThumbnailUrl(url);
      }

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded successfully`,
      });

      return attachment;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload file. Please try again.",
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
