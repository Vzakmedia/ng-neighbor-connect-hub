import { useEffect, useCallback, useRef } from 'react';

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

interface LifecycleCallbacks {
  onActive?: () => void | Promise<void>;
  onBackground?: () => void | Promise<void>;
  onInactive?: () => void | Promise<void>;
  onResume?: () => void | Promise<void>;
}

export const useIOSAppLifecycle = (callbacks: LifecycleCallbacks = {}) => {
  const isNative = isNativePlatform();
  const previousState = useRef<string>('active');

  const handleStateChange = useCallback(async (state: { isActive: boolean }) => {
    const isActive = state.isActive;
    const currentState = isActive ? 'active' : 'background';

    if (previousState.current === currentState) return;

    if (currentState === 'active') {
      // App came to foreground
      await callbacks.onActive?.();
      
      // If coming from background, trigger resume
      if (previousState.current === 'background') {
        await callbacks.onResume?.();
      }
    } else if (currentState === 'background') {
      // App went to background
      await callbacks.onBackground?.();
    }

    previousState.current = currentState;
  }, [callbacks]);

  useEffect(() => {
    if (!isNative) return;

    let listener: any;

    const setupListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        listener = await App.addListener('appStateChange', handleStateChange);
      } catch (error) {
        console.error('Failed to setup app lifecycle listener:', error);
      }
    };

    setupListener();

    return () => {
      listener?.remove();
    };
  }, [isNative, handleStateChange]);

  const exitApp = useCallback(async () => {
    if (!isNative) return;

    try {
      const { App } = await import('@capacitor/app');
      await App.exitApp();
    } catch (error) {
      console.error('Failed to exit app:', error);
    }
  }, [isNative]);

  return {
    exitApp,
  };
};
