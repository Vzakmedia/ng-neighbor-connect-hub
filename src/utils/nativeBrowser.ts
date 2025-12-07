const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

/**
 * Opens a URL using native browser on mobile or window.open on web
 * Automatically detects special URLs (tel:, mailto:, sms:) and handles them appropriately
 */
export const openUrl = async (
  url: string,
  target: '_blank' | '_self' = '_blank',
  options?: string
): Promise<void> => {
  const isNative = isNativePlatform();
  
  // Special URL schemes should always use window.open
  const isSpecialScheme = url.startsWith('tel:') || 
                         url.startsWith('mailto:') || 
                         url.startsWith('sms:');
  
  if (isSpecialScheme) {
    window.open(url, target);
    return;
  }

  // For native platforms, use Browser plugin for external URLs
  if (isNative) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ 
        url,
        presentationStyle: 'popover',
      });
    } catch (error) {
      console.error('Failed to open browser:', error);
      // Fallback to window.open
      window.open(url, target, options);
    }
  } else {
    // Web: use regular window.open
    window.open(url, target, options);
  }
};

/**
 * Closes the in-app browser (native only)
 */
export const closeBrowser = async (): Promise<void> => {
  if (!isNativePlatform()) return;
  
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.close();
  } catch (error) {
    console.error('Failed to close browser:', error);
  }
};
