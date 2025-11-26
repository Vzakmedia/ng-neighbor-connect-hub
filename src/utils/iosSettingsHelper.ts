import { Capacitor } from '@capacitor/core';

/**
 * iOS Settings Helper Utilities
 * Provides functions to redirect users to iOS system settings
 */

export const isIOS = () => {
  const platform = Capacitor.getPlatform();
  return platform === 'ios' || /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Open iOS app settings
 */
export const openAppSettings = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.warn('openAppSettings only works on native platforms');
    return false;
  }

  try {
    if (isIOS()) {
      // Open iOS Settings using system deep link
      window.location.href = 'app-settings:';
      return true;
    } else {
      // For Android, use intent to open app settings
      const packageName = 'app.lovable.neighborlink'; // Your app package name
      window.location.href = `intent://settings#Intent;scheme=package;package=${packageName};end`;
      return true;
    }
  } catch (error) {
    console.error('Error opening app settings:', error);
    return false;
  }
};

/**
 * Check if a permission was denied at system level
 * Returns true if permission needs to be enabled in Settings
 */
export const isPermissionDeniedAtSystemLevel = async (
  permission: 'location' | 'camera' | 'notifications'
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    if (permission === 'location') {
      const { Geolocation } = await import('@capacitor/geolocation');
      try {
        await Geolocation.checkPermissions();
        return false;
      } catch (error: any) {
        return error?.message?.includes('denied') || error?.message?.includes('restricted');
      }
    } else if (permission === 'camera') {
      const { Camera } = await import('@capacitor/camera');
      try {
        const result = await Camera.checkPermissions();
        return result.camera === 'denied';
      } catch (error) {
        return false;
      }
    } else if (permission === 'notifications') {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      try {
        const result = await LocalNotifications.checkPermissions();
        return result.display === 'denied';
      } catch (error) {
        return false;
      }
    }
  } catch (error) {
    console.error('Error checking permission status:', error);
  }

  return false;
};

/**
 * Generate appropriate settings URL for specific permission type
 */
export const getSettingsUrlForPermission = (
  permission: 'location' | 'camera' | 'notifications' | 'general'
): string => {
  if (!isIOS()) return 'app://settings';

  // iOS-specific deep links to settings
  switch (permission) {
    case 'location':
      return 'app-settings:root=Privacy&path=LOCATION';
    case 'camera':
      return 'app-settings:root=Privacy&path=CAMERA';
    case 'notifications':
      return 'app-settings:root=NOTIFICATIONS_ID';
    default:
      return 'app-settings:';
  }
};

/**
 * Show alert and redirect to settings
 */
export const promptToOpenSettings = (
  permission: string,
  onConfirm?: () => void
): void => {
  const permissionName = permission.charAt(0).toUpperCase() + permission.slice(1);
  
  if (confirm(
    `${permissionName} permission is required. Would you like to open Settings to enable it?`
  )) {
    openAppSettings();
    onConfirm?.();
  }
};
