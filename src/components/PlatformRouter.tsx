import { ReactNode, useState } from 'react';
import { HashRouter, BrowserRouter } from 'react-router-dom';
import { isNativePlatform } from '@/utils/nativeStartup';

interface PlatformRouterProps {
  children: ReactNode;
}

/**
 * Platform-aware router that uses:
 * - HashRouter for native Capacitor apps (required for file system)
 * - BrowserRouter for web browsers (compatible with Lovable preview)
 */
const PlatformRouter = ({ children }: PlatformRouterProps) => {
  // Initialize synchronously since isNativePlatform() is safe and synchronous
  const [isNative] = useState<boolean>(() => {
    try {
      const native = isNativePlatform();
      console.log('[PlatformRouter] Platform detected:', native ? 'NATIVE' : 'WEB');
      return native;
    } catch (error) {
      console.error('[PlatformRouter] Platform detection error:', error);
      return false;
    }
  });

  // Native apps need HashRouter for file system compatibility
  if (isNative) {
    console.log('[PlatformRouter] Using HashRouter for native app');
    return <HashRouter>{children}</HashRouter>;
  }

  // Web browsers use BrowserRouter (compatible with Lovable preview tokens)
  console.log('[PlatformRouter] Using BrowserRouter for web');
  return <BrowserRouter>{children}</BrowserRouter>;
};

export default PlatformRouter;
