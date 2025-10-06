import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export const useNativeNetwork = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      if (isNative) {
        try {
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

    checkStatus();

    if (isNative) {
      // Listen for network status changes
      Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
        if (mounted) {
          setIsOnline(status.connected);
          setConnectionType(status.connectionType);
        }
      }).then(handler => {
        return () => {
          mounted = false;
          handler.remove();
        };
      });

      return () => {
        mounted = false;
      };
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
  }, [isNative]);

  return {
    isOnline,
    connectionType,
    isNative,
  };
};
