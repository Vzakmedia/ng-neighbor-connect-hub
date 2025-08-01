import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'file';
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export const useFileUpload = (userId: string) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File): Promise<Attachment | null> => {
    try {
      setUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload file to storage
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

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
  }, [userId, toast]);

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