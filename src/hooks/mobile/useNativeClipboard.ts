import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

export const useNativeClipboard = () => {
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const writeText = async (text: string): Promise<boolean> => {
    try {
      if (isNative) {
        await Clipboard.write({ string: text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  const readText = async (): Promise<string | null> => {
    try {
      if (isNative) {
        const { value } = await Clipboard.read();
        return value;
      } else {
        return await navigator.clipboard.readText();
      }
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      return null;
    }
  };

  const copyToClipboard = async (text: string, successMessage?: string): Promise<void> => {
    const success = await writeText(text);
    if (success && successMessage) {
      toast({
        title: "Copied!",
        description: successMessage,
      });
    }
  };

  return {
    writeText,
    readText,
    copyToClipboard,
    isNative,
  };
};
