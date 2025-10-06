import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const useNativeHaptics = () => {
  const isNative = Capacitor.isNativePlatform();

  const impact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isNative) return;

    try {
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const notification = async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!isNative) return;

    try {
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: typeMap[type] });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const vibrate = async (duration: number = 300) => {
    if (!isNative) return;

    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const selectionStart = async () => {
    if (!isNative) return;

    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const selectionChanged = async () => {
    if (!isNative) return;

    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const selectionEnd = async () => {
    if (!isNative) return;

    try {
      await Haptics.selectionEnd();
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  return {
    impact,
    notification,
    vibrate,
    selectionStart,
    selectionChanged,
    selectionEnd,
    isNative,
  };
};
