import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNativeNetwork } from '@/hooks/mobile/useNativeNetwork';
import { Capacitor } from '@capacitor/core';

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'file';
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
}

export const useFileUpload = (userId: string) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { connectionType } = useNativeNetwork();
  const isNative = Capacitor.isNativePlatform();

  const uploadFile = useCallback(async (file: File): Promise<Attachment | null> => {
    try {
      // Warn on large uploads over cellular
      if (isNative && connectionType === 'cellular' && file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Large Upload on Cellular',
          description: `Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB over cellular data. Consider using WiFi.`,
        });
      }

      setUploading(true);
      
      let fileToUpload = file;
      
      // Optimize images before upload (Phase 13)
      if (file.type.startsWith('image/')) {
        const { useNativeImageOptimization } = await import('@/hooks/mobile/useNativeImageOptimization');
        const { optimizeImage } = useNativeImageOptimization();
        const optimizedResult = await optimizeImage(file, {
          quality: 80,
          maxWidth: 1920,
          maxHeight: 1920
        });
        if (optimizedResult) {
          fileToUpload = optimizedResult.file;
        }
      }
      
      // Generate unique filename
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload file to storage
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, fileToUpload);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      // Determine file type
      let fileType: 'image' | 'video' | 'file' = 'file';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      }

      const attachment: Attachment = {
        id: data.path,
        type: fileType,
        name: file.name,
        url: publicUrl,
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
    }
  }, [userId, toast, isNative, connectionType]);

  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<Attachment[]> => {
    const attachments: Attachment[] = [];
    
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
    uploadFile,
    uploadMultipleFiles
  };
};