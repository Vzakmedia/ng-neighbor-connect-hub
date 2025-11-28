import { useState } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

export const useFileSave = () => {
  const [isSaving, setIsSaving] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const { toast } = useToast();

  const saveFile = async (url: string, fileName: string, mimeType?: string) => {
    setIsSaving(true);
    
    try {
      if (isNative) {
        // Native: Fetch file and save to Documents directory
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Convert blob to base64
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64String = base64.split(',')[1];
            resolve(base64String);
          };
          reader.readAsDataURL(blob);
        });

        // Save to Documents directory (user-accessible on iOS/Android)
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents
        });

        toast({
          title: "File saved successfully!",
          description: `Saved to Documents/${fileName}`,
        });
      } else {
        // Web: Trigger browser download
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Download started",
          description: fileName,
        });
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save file",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { saveFile, isSaving, isNative };
};
