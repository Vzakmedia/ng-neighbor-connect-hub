import { useEffect } from 'react';
import { useNativePushRegistration } from '@/hooks/mobile/useNativePushRegistration';

/**
 * Component that handles native push registration on iOS/Android
 * This is a separate component so the hook can be called properly
 */
export const NativePushRegistration = () => {
  useNativePushRegistration();
  return null;
};

export default NativePushRegistration;
