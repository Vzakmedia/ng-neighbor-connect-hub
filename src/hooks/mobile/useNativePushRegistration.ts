import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { playMessagingChime } from '@/utils/audioUtils';

const getPlatform = () => {
  try {
    return Capacitor.getPlatform();
  } catch {
    return 'web';
  }
};

const platformToLabel = (p: string) => (p === 'ios' || p === 'android' ? p : 'web');

export const useNativePushRegistration = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const platform = getPlatform();
    if (platform === 'web') return; // Native only

    const init = async () => {
      try {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== 'granted') return;

        await PushNotifications.register();

        // Registration success
        const regListener = await PushNotifications.addListener('registration', async (token) => {
          try {
            await supabase.rpc('register_user_device', {
              platform: platformToLabel(platform),
              fcm_token: platform === 'android' ? token.value : null,
              apns_token: platform === 'ios' ? token.value : null,
              device_model: navigator.userAgent,
            });
            console.log('Registered device push token');
          } catch (err) {
            console.error('Failed to upsert device token', err);
          }
        });

        // Foreground notifications
        const recvListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          playMessagingChime();
          const title = notification.title || 'New notification';
          const body = notification.body || '';
          toast({ title, description: body });
        });

        // Errors
        const errListener = await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

        return () => {
          regListener.remove();
          recvListener.remove();
          errListener.remove();
        };
      } catch (e) {
        console.error('Push init error', e);
      }
    };

    const cleanupPromise = init();
    return () => {
      // ensure listeners removed
      cleanupPromise.then((cleanup: any) => cleanup && cleanup());
    };
  }, [user]);
};

export default useNativePushRegistration;
