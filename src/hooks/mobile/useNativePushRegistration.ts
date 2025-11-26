import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, PermissionStatus } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { nativeAudioManager } from '@/utils/nativeAudioManager';

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
        // Request push notification permissions
        let perm: PermissionStatus;
        try {
          perm = await PushNotifications.requestPermissions();
        } catch (permError) {
          console.error('Failed to request push permissions:', permError);
          toast({
            title: 'Push Notifications Unavailable',
            description: 'Could not request notification permissions. Some features may be limited.',
            variant: 'destructive',
          });
          return;
        }

        if (perm.receive !== 'granted') {
          console.log('Push notification permission not granted:', perm.receive);
          
          // Set up local notifications as fallback
          try {
            const localPerm = await LocalNotifications.requestPermissions();
            if (localPerm.display === 'granted') {
              console.log('Local notifications enabled as fallback');
            }
          } catch (localError) {
            console.error('Failed to set up local notifications fallback:', localError);
          }
          return;
        }

        // Register for push notifications
        try {
          await PushNotifications.register();
        } catch (registerError) {
          console.error('Failed to register for push notifications:', registerError);
          
          // iOS-specific error handling
          if (platform === 'ios') {
            toast({
              title: 'Push Setup Issue',
              description: 'Make sure the app is properly provisioned with Apple Push Notification service (APNs).',
              variant: 'destructive',
            });
          }
          
          // Set up local notifications as fallback
          try {
            await LocalNotifications.requestPermissions();
            console.log('Using local notifications as fallback');
          } catch (fallbackError) {
            console.error('Failed to set up fallback notifications:', fallbackError);
          }
          return;
        }

        // Registration success
        const regListener = await PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration successful:', { platform, tokenLength: token.value.length });
          
          try {
            await (supabase as any).rpc('register_user_device', {
              platform: platformToLabel(platform),
              fcm_token: platform === 'android' ? token.value : null,
              apns_token: platform === 'ios' ? token.value : null,
              device_model: navigator.userAgent,
            });
            console.log('Device push token registered in database');
            
            toast({
              title: 'Notifications Enabled',
              description: 'You will receive important updates and alerts.',
            });
          } catch (err) {
            console.error('Failed to save device token to database:', err);
            toast({
              title: 'Partial Setup',
              description: 'Notifications are enabled but registration needs completion.',
              variant: 'destructive',
            });
          }
        });

        // Foreground notifications
        const recvListener = await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          // Play native notification sound
          await nativeAudioManager.play('notification', 0.7);
          
          const title = notification.title || 'New notification';
          const body = notification.body || '';
          toast({ title, description: body });
        });

        // Errors
        const errListener = await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
          
          // Provide helpful error messages
          let errorMessage = 'Could not set up push notifications.';
          
          if (platform === 'ios') {
            if (error.error.includes('certificate') || error.error.includes('provision')) {
              errorMessage = 'APNs certificate issue. App needs proper provisioning profile.';
            } else if (error.error.includes('simulator')) {
              errorMessage = 'Push notifications are not available in iOS Simulator.';
            }
          }
          
          toast({
            title: 'Push Notification Error',
            description: errorMessage,
            variant: 'destructive',
          });
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
