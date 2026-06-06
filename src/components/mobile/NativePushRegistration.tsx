import { useNativePushRegistration } from '@/hooks/mobile/useNativePushRegistration';
import { useBackgroundFetch } from '@/hooks/mobile/useBackgroundFetch';

export const NativePushRegistration = () => {
  useNativePushRegistration();
  useBackgroundFetch();
  return null;
};

export default NativePushRegistration;
