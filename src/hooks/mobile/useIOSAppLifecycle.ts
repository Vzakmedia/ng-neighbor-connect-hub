import { useEffect, useCallback, useRef } from 'react';
import { App, AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface LifecycleCallbacks {
  onActive?: () => void | Promise<void>;
  onBackground?: () => void | Promise<void>;
  onInactive?: () => void | Promise<void>;
  onResume?: () => void | Promise<void>;
}

export const useIOSAppLifecycle = (callbacks: LifecycleCallbacks = {}) => {
  const isNative = Capacitor.isNativePlatform();
  const previousState = useRef<string>('active');

  const handleStateChange = useCallback(async (state: AppState) => {
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
      listener = await App.addListener('appStateChange', handleStateChange);
    };

    setupListener();

    return () => {
      listener?.remove();
    };
  }, [isNative, handleStateChange]);

  const exitApp = useCallback(async () => {
    if (!isNative) return;

    try {
      await App.exitApp();
    } catch (error) {
      console.error('Failed to exit app:', error);
    }
  }, [isNative]);

  return {
    exitApp,
  };
};
