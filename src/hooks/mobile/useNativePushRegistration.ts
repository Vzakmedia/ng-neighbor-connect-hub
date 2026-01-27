import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { nativeAudioManager } from '@/utils/nativeAudioManager';

const platformToLabel = (p: string) => (p === 'ios' || p === 'android' ? p : 'web');

export const useNativePushRegistration = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Use window.Capacitor for safe platform check
    if (!window.Capacitor?.isNativePlatform?.()) return;

    let cleanupFn: (() => void) | undefined;

    const init = async () => {
      try {
        // Dynamic imports only on native
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        const platform = window.Capacitor?.getPlatform?.() || 'web';

        // Request push notification permissions
        let perm;
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

          // Handle incoming call notifications
          const notificationData = notification.data as any;
          if (notificationData?.notification_type === 'call_incoming') {
            // Trigger incoming call UI
            const callData = notificationData.notification_metadata;
            window.dispatchEvent(new CustomEvent('incoming-call', {
              detail: {
                conversationId: callData.conversation_id,
                callerId: callData.caller_id,
                callerName: callData.caller_name,
                callType: callData.call_type,
              }
            }));

            toast({
              title: `Incoming ${callData.call_type} call`,
              description: `${callData.caller_name} is calling...`
            });
          } else {
            toast({ title, description: body });
          }
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

        cleanupFn = () => {
          regListener.remove();
          recvListener.remove();
          errListener.remove();
        };
      } catch (e) {
        console.error('Push init error', e);
      }
    };

    init();

    return () => {
      cleanupFn?.();
    };
  }, [user]);
};

export default useNativePushRegistration;