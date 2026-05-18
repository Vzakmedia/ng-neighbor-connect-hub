import { useState, useEffect, useRef } from 'react';

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

export const useNativeNetwork = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const isNative = isNativePlatform();
  // WR-16: Use a ref to reliably track and clean up the native listener
  const listenerRef = useRef<{ remove: () => Promise<void> } | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      if (isNative) {
        try {
          const { Network } = await import('@capacitor/network');
          const status = await Network.getStatus();
          if (mounted) {
            setIsOnline(status.connected);
            setConnectionType(status.connectionType);
          }
        } catch (error) {
          console.error('Failed to get network status:', error);
        }
      } else {
        // Web fallback
        setIsOnline(navigator.onLine);
        setConnectionType('unknown');
      }
    };

    const setupNativeListener = async () => {
      if (isNative) {
        try {
          const { Network } = await import('@capacitor/network');
          listenerRef.current = await Network.addListener('networkStatusChange', (status) => {
            if (mounted) {
              setIsOnline(status.connected);
              setConnectionType(status.connectionType);
            }
          });
        } catch (error) {
          console.error('Failed to add network listener:', error);
        }
      }
    };

    checkStatus();

    if (isNative) {
      setupNativeListener();
    } else {
      // Web fallback listeners
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        mounted = false;
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      mounted = false;
      listenerRef.current?.remove?.();
      listenerRef.current = null;
    };
  }, [isNative]);

  return {
    isOnline,
    connectionType,
    isNative,
  };
};
