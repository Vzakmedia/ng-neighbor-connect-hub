import { useIsMobile } from './use-mobile';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to determine if filled/solid icons should be used for active states.
 * Returns true on mobile viewports (< 768px) or native platforms (iOS/Android).
 * Desktop always uses outlined icons for a cleaner aesthetic.
 */
export const useMobileIcons = () => {
  const isMobile = useIsMobile();
  const isNative = Capacitor.isNativePlatform();
  
  // Use filled icons for active states on mobile OR native
  const shouldUseFilledIcons = isMobile || isNative;
  
  return { shouldUseFilledIcons, isMobile, isNative };
};
