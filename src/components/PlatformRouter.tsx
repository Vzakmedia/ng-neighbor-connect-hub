import { ReactNode, useEffect, useState } from 'react';
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
  const [isNative, setIsNative] = useState<boolean | null>(null);

  useEffect(() => {
    const native = isNativePlatform();
    console.log('[PlatformRouter] Platform detected:', native ? 'NATIVE' : 'WEB');
    setIsNative(native);
  }, []);

  // Show nothing until platform is determined to avoid router switch
  if (isNative === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
