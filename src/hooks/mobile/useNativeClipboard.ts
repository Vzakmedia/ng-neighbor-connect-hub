import { useToast } from '@/hooks/use-toast';

const isNativePlatform = (): boolean => {
  return (window as any).Capacitor?.isNativePlatform?.() === true;
};

export const useNativeClipboard = () => {
  const { toast } = useToast();
  const isNative = isNativePlatform();

  const writeText = async (text: string): Promise<boolean> => {
    try {
      if (isNative) {
        const { Clipboard } = await import('@capacitor/clipboard');
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
        const { Clipboard } = await import('@capacitor/clipboard');
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
