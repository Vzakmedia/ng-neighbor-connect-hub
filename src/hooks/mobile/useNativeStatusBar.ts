import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export const useNativeStatusBar = () => {
  const isNative = Capacitor.isNativePlatform();

  const setStyle = async (style: 'light' | 'dark') => {
    if (!isNative) return;

    try {
      await StatusBar.setStyle({
        style: style === 'light' ? Style.Light : Style.Dark,
      });
    } catch (error) {
      console.error('StatusBar error:', error);
    }
  };

  const setBackgroundColor = async (color: string) => {
    if (!isNative || Capacitor.getPlatform() !== 'android') return;

    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error('StatusBar error:', error);
    }
  };

  const show = async () => {
    if (!isNative) return;

    try {
      await StatusBar.show();
    } catch (error) {
      console.error('StatusBar error:', error);
    }
  };

  const hide = async () => {
    if (!isNative) return;

    try {
      await StatusBar.hide();
    } catch (error) {
      console.error('StatusBar error:', error);
    }
  };

  return {
    setStyle,
    setBackgroundColor,
    show,
    hide,
    isNative,
  };
};

/**
 * Initialize status bar on app start
 */
export const initializeStatusBar = async (theme: 'light' | 'dark' = 'light') => {
  const isNative = Capacitor.isNativePlatform();
  if (!isNative) return;

  try {
    await StatusBar.setStyle({
      style: theme === 'light' ? Style.Dark : Style.Light,
    });

    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#667eea' });
    }
  } catch (error) {
    console.error('Failed to initialize status bar:', error);
  }
};
