import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary, getVideoThumbnailUrl } from '@/services/cloudinaryService';
import { validateMedia, getMediaType } from '@/utils/mediaValidation';
import { checkIsNativePlatform, checkNetworkStatus } from '@/utils/nativeEdgeFunctions';

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
    const timestamp = Date.now();
    const isNative = checkIsNativePlatform();
    
    console.log(`[useCloudinaryUpload] uploadFile started, timestamp: ${timestamp}`);
    console.log(`[useCloudinaryUpload] File: ${file.name}, size: ${file.size}, type: ${file.type}`);
    console.log(`[useCloudinaryUpload] Platform: ${isNative ? 'native' : 'web'}, userId: ${userId}, folder: ${folder}`);
    
    try {
      // Check if user is authenticated
      if (!userId) {
        console.error('[useCloudinaryUpload] No userId provided');
        toast({
          title: "Authentication required",
          description: "Please sign in to upload files",
          variant: "destructive",
        });
        return null;
      }

      // Validate file
      console.log('[useCloudinaryUpload] Validating file...');
      const validation = validateMedia(file);
      if (!validation.valid) {
        console.error('[useCloudinaryUpload] Validation failed:', validation.error);
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return null;
      }
      console.log('[useCloudinaryUpload] File validation passed');

      // Check network type for large files on native
      const isVideo = file.type.startsWith('video/');
      
      if (isNative && file.size > 20 * 1024 * 1024) {
        console.log('[useCloudinaryUpload] Large file on native, checking network...');
        try {
          const networkStatus = await checkNetworkStatus();
          console.log('[useCloudinaryUpload] Network status:', networkStatus);
          
          if (networkStatus.connectionType === 'cellular') {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            const shouldContinue = confirm(
              `Uploading ${sizeMB}MB over cellular data. This may use significant data. Continue?`
            );
            if (!shouldContinue) {
              console.log('[useCloudinaryUpload] User cancelled cellular upload');
              return null;
            }
          }
        } catch (error) {
          console.warn('[useCloudinaryUpload] Could not check network status:', error);
        }
      }

      setUploading(true);
      setProgress(0);
      setCurrentFileName(file.name);
      setCurrentFileSize(file.size);
      setUploadedBytes(0);
      setUploadSpeed(0);
      const startTime = Date.now();
      setUploadStartTime(startTime);
      
      const userFolder = `${folder}/${userId}`;
      console.log(`[useCloudinaryUpload] Starting upload to folder: ${userFolder}`);
      
      // Enhanced progress callback with speed calculation
      const progressCallback = (progressPercent: number) => {
        setProgress(progressPercent);
        const bytesUploaded = Math.round((progressPercent / 100) * file.size);
        setUploadedBytes(bytesUploaded);
        
        // Calculate upload speed
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        if (elapsedSeconds > 0) {
          const speed = Math.round(bytesUploaded / elapsedSeconds);
          setUploadSpeed(speed);
        }
      };
      
      console.log('[useCloudinaryUpload] Calling uploadToCloudinary...');
      const url = await uploadToCloudinary(file, userFolder, progressCallback);

      if (!url) {
        console.error('[useCloudinaryUpload] uploadToCloudinary returned null');
        throw new Error('Upload failed');
      }

      console.log(`[useCloudinaryUpload] Upload successful: ${url}`);
      
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
        console.log(`[useCloudinaryUpload] Video thumbnail: ${attachment.thumbnailUrl}`);
      }

      const elapsed = Date.now() - timestamp;
      console.log(`[useCloudinaryUpload] Upload completed in ${elapsed}ms`);
      
      toast({
        title: "Upload successful",
        description: `${file.name} uploaded successfully`,
      });

      return attachment;
    } catch (error: any) {
      console.error('[useCloudinaryUpload] Upload error:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      console.log('[useCloudinaryUpload] Cleaning up state...');
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
    console.log(`[useCloudinaryUpload] uploadMultipleFiles: ${files.length} files`);
    const attachments: CloudinaryAttachment[] = [];
    setTotalFilesCount(files.length);
    
    for (let i = 0; i < files.length; i++) {
      console.log(`[useCloudinaryUpload] Uploading file ${i + 1}/${files.length}: ${files[i].name}`);
      setCurrentFileIndex(i + 1);
      const attachment = await uploadFile(files[i]);
      if (attachment) {
        attachments.push(attachment);
      }
    }
    
    console.log(`[useCloudinaryUpload] All uploads complete: ${attachments.length}/${files.length} successful`);
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
