const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

export const useNativeShare = () => {
  const isNative = isNativePlatform();

  const share = async (options: {
    title?: string;
    text?: string;
    url?: string;
  }): Promise<boolean> => {
    try {
      if (isNative) {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: 'Share',
        });
        return true;
      } else {
        // Web fallback
        if (navigator.share) {
          await navigator.share(options);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.log('Share cancelled or failed:', error);
      return false;
    }
  };

  const canShare = (): boolean => {
    return isNative || !!navigator.share;
  };

  return {
    share,
    canShare,
    isNative,
  };
};
