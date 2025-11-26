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
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [currentFileSize, setCurrentFileSize] = useState<number>(0);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [totalFilesCount, setTotalFilesCount] = useState<number>(0);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File): Promise<CloudinaryAttachment | null> => {
    try {
      // Check if user is authenticated
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload files",
          variant: "destructive",
        });
        return null;
      }

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
      setCurrentFileName(file.name);
      setCurrentFileSize(file.size);
      setUploadedBytes(0);
      setUploadSpeed(0);
      setUploadStartTime(Date.now());
      
      const userFolder = `${folder}/${userId}`;
      
      // Enhanced progress callback with speed calculation
      const progressCallback = (progressPercent: number) => {
        setProgress(progressPercent);
        const bytesUploaded = Math.round((progressPercent / 100) * file.size);
        setUploadedBytes(bytesUploaded);
        
        // Calculate upload speed
        const elapsedSeconds = (Date.now() - uploadStartTime) / 1000;
        if (elapsedSeconds > 0) {
          const speed = Math.round(bytesUploaded / elapsedSeconds);
          setUploadSpeed(speed);
        }
      };
      
      const url = await uploadToCloudinary(file, userFolder, progressCallback);

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
      setCurrentFileName('');
      setCurrentFileSize(0);
      setUploadedBytes(0);
      setUploadSpeed(0);
      setUploadStartTime(0);
    }
  }, [userId, folder, toast]);

  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<CloudinaryAttachment[]> => {
    const attachments: CloudinaryAttachment[] = [];
    setTotalFilesCount(files.length);
    
    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i + 1);
      const attachment = await uploadFile(files[i]);
      if (attachment) {
        attachments.push(attachment);
      }
    }
    
    setTotalFilesCount(0);
    setCurrentFileIndex(0);
    return attachments;
  }, [uploadFile]);

  return {
    uploading,
    progress,
    currentFileName,
    currentFileSize,
    uploadedBytes,
    uploadSpeed,
    currentFileIndex,
    totalFilesCount,
    uploadFile,
    uploadMultipleFiles
  };
};
