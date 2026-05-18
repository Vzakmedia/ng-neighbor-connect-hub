import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { nativeAudioManager } from '@/utils/nativeAudioManager';

const platformToLabel = (p: string) => (p === 'ios' || p === 'android' ? p : 'web');

const UUID_REGEX = /^[0-9a-f-]{36}$/i;
const VALID_CALL_TYPES = ['voice', 'video'];

/**
 * Validates and sanitizes push notification call data.
 * Returns the sanitized record, or null if validation fails.
 */
function validateCallData(raw: Record<string, string>): Record<string, string> | null {
  const conversationId = raw.conversation_id || raw.conversationId;
  if (!conversationId || !UUID_REGEX.test(conversationId)) {
    console.warn('[PushRegistration] Invalid or missing conversation_id');
    return null;
  }

  const callType = raw.call_type || raw.callType;
  if (!callType || !VALID_CALL_TYPES.includes(callType)) {
    console.warn('[PushRegistration] Invalid or missing call_type');
    return null;
  }

  const rawCallerName = raw.caller_name || raw.callerName || '';
  const callerName = rawCallerName.replace(/<[^>]*>/g, '').substring(0, 100);

  return { ...raw, caller_name: callerName, callerName, call_type: callType, callType, conversation_id: conversationId, conversationId };
}

/** Dispatches the internal incoming-call event consumed by CallService / CallContext. */
function dispatchIncomingCall(callData: Record<string, string>) {
  window.dispatchEvent(new CustomEvent('incoming-call', {
    detail: {
      conversationId: callData.conversation_id || callData.conversationId,
      callerId: callData.caller_id || callData.callerId,
      callerName: callData.caller_name || callData.callerName,
      callType: callData.call_type || callData.callType,
    }
  }));
}

/** Dispatches an accept-call event (user tapped Accept on the OS notification). */
function dispatchAcceptCall(callData: Record<string, string>) {
  window.dispatchEvent(new CustomEvent('accept-call', {
    detail: {
      conversationId: callData.conversation_id || callData.conversationId,
      isVideo: (callData.call_type || callData.callType) === 'video',
    }
  }));
}

/** Dispatches a decline-call event (user tapped Decline on the OS notification). */
function dispatchDeclineCall(callData: Record<string, string>) {
  window.dispatchEvent(new CustomEvent('decline-call', {
    detail: {
      conversationId: callData.conversation_id || callData.conversationId,
    }
  }));
}

export const useNativePushRegistration = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!window.Capacitor?.isNativePlatform?.()) return;

    let cleanupFn: (() => void) | undefined;

    const init = async () => {
      // WR-01: cancelled flag to guard against race on cleanup
      let cancelled = false;

      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        const platform = window.Capacitor?.getPlatform?.() || 'web';

        // ── Register call action type (Accept / Decline buttons on the banner) ──
        try {
          await LocalNotifications.registerActionTypes({
            types: [
              {
                id: 'CALL_ACTIONS',
                actions: [
                  {
                    id: 'DECLINE_CALL',
                    title: 'Decline',
                    destructive: true,
                    foreground: false,
                  },
                  {
                    id: 'ACCEPT_CALL',
                    title: 'Accept',
                    foreground: true,
                  },
                ],
              },
            ],
          });
        } catch (e) {
          console.warn('[PushRegistration] Could not register action types:', e);
        }

        // ── Request push permissions ──
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
          if (import.meta.env.DEV) {
            console.log('Push notification permission not granted:', perm.receive);
          }
          try {
            const localPerm = await LocalNotifications.requestPermissions();
            if (import.meta.env.DEV && localPerm.display === 'granted') {
              console.log('Local notifications enabled as fallback');
            }
          } catch (localError) {
            console.error('Failed to set up local notifications fallback:', localError);
          }
          return;
        }

        // ── Register for remote push ──
        try {
          await PushNotifications.register();
        } catch (registerError) {
          console.error('Failed to register for push notifications:', registerError);
          if (platform === 'ios') {
            toast({
              title: 'Push Setup Issue',
              description: 'Make sure the app is properly provisioned with Apple Push Notification service (APNs).',
              variant: 'destructive',
            });
          }
          try {
            await LocalNotifications.requestPermissions();
          } catch (_) { /* ignore */ }
          return;
        }

        // ── Listeners ──
        const regListener = await PushNotifications.addListener('registration', async (token) => {
          // WR-02: gate token log with DEV
          if (import.meta.env.DEV) {
            console.log('[PushRegistration] Token received, platform:', platform);
          }
          try {
            await supabase.rpc('register_user_device' as never, {
              platform: platformToLabel(platform),
              fcm_token: platform === 'android' ? token.value : null,
              apns_token: platform === 'ios' ? token.value : null,
              device_model: platform, // WR-03: use platform string, not userAgent
            } as never);
            toast({ title: 'Notifications Enabled', description: 'You will receive important updates and alerts.' });
          } catch (err) {
            console.error('[PushRegistration] Failed to save device token:', err);
          }
        });

        // WR-01: check cancelled after each addListener
        if (cancelled) { regListener.remove(); return; }

        // ── Foreground push received ──
        const recvListener = await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          if (import.meta.env.DEV) {
            console.log('[PushRegistration] Push received (foreground):', notification);
          }
          await nativeAudioManager.play('notification', 0.7);

          const notificationData = (notification.data || {}) as Record<string, string>;
          const isCallNotification =
            notificationData?.notification_type === 'call_incoming' ||
            notificationData?.type === 'call_incoming';

          if (isCallNotification) {
            // CR-01: validate push notification payload before dispatch
            let rawCallData: Record<string, string>;
            if (notificationData.notification_metadata) {
              try {
                rawCallData = JSON.parse(notificationData.notification_metadata as string) as Record<string, string>;
              } catch (e) {
                console.warn('[PushRegistration] Failed to parse notification_metadata', e);
                return;
              }
            } else {
              rawCallData = notificationData;
            }

            const callData = validateCallData(rawCallData);
            if (!callData) {
              console.warn('[PushRegistration] Call data failed validation, ignoring notification');
              return;
            }

            if (import.meta.env.DEV) {
              console.log('[PushRegistration] Triggering incoming call UI', callData);
            }

            // Show native system call UI (CallKit on iOS, ConnectionService on Android)
            if (window.Capacitor?.isNativePlatform()) {
              import('@/utils/NativeCallManager').then(({ NativeCallManager }) => {
                NativeCallManager.receiveCall(
                  callData.caller_name || callData.callerName || 'Someone',
                  callData.conversation_id || callData.conversationId || 'default'
                );
              });
            }

            // Update in-app UI state
            dispatchIncomingCall(callData);

            // Schedule a local fallback notification with Accept/Decline actions
            // (shown if the native call plugin is not available)
            try {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: `Incoming ${callData.call_type || 'voice'} call`,
                    body: `${callData.caller_name || 'Someone'} is calling you`,
                    id: Math.floor(Date.now() / 1000) & 0x7fffffff,
                    sound: 'call_ringtone.wav',
                    attachments: [],
                    actionTypeId: 'CALL_ACTIONS',
                    extra: callData,
                    // Android: high priority + full-screen intent
                    channelId: 'incoming_calls',
                  },
                ],
              });
            } catch (localError) {
              console.warn('[PushRegistration] Local notification fallback failed:', localError);
            }
          } else {
            // Regular notification (message, alert, etc.)
            toast({
              title: notification.title || 'New notification',
              description: notification.body || '',
            });
          }
        });

        // WR-01: check cancelled
        if (cancelled) { regListener.remove(); recvListener.remove(); return; }

        // ── User tapped a notification action (Accept / Decline buttons) ──
        const actionListener = await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (action) => {
            const callData = (action.notification.extra || {}) as Record<string, string>;
            if (import.meta.env.DEV) {
              console.log('[PushRegistration] Notification action performed:', action.actionId, callData);
            }

            if (action.actionId === 'ACCEPT_CALL') {
              dispatchAcceptCall(callData);
            } else if (action.actionId === 'DECLINE_CALL') {
              dispatchDeclineCall(callData);
            } else {
              // Default tap — open the call UI
              dispatchIncomingCall(callData);
            }
          }
        );

        // WR-01: check cancelled
        if (cancelled) { regListener.remove(); recvListener.remove(); actionListener.remove(); return; }

        // ── User tapped the push notification itself (app was backgrounded) ──
        const tapListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            const notificationData = (action.notification.data || {}) as Record<string, string>;
            const isCallNotification =
              notificationData?.notification_type === 'call_incoming' ||
              notificationData?.type === 'call_incoming';

            if (isCallNotification) {
              // CR-02: validate in tapListener as well
              let rawCallData: Record<string, string>;
              if (notificationData.notification_metadata) {
                try {
                  rawCallData = JSON.parse(notificationData.notification_metadata as string) as Record<string, string>;
                } catch (e) {
                  console.warn('[PushRegistration] tapListener: Failed to parse notification_metadata', e);
                  return;
                }
              } else {
                rawCallData = notificationData;
              }

              const callData = validateCallData(rawCallData);
              if (!callData) {
                console.warn('[PushRegistration] tapListener: Call data failed validation, ignoring');
                return;
              }

              if (import.meta.env.DEV) {
                console.log('[PushRegistration] Push tapped for call:', callData);
              }
              dispatchIncomingCall(callData);
            }
          }
        );

        // WR-01: check cancelled
        if (cancelled) { regListener.remove(); recvListener.remove(); actionListener.remove(); tapListener.remove(); return; }

        // ── Registration error ──
        const errListener = await PushNotifications.addListener('registrationError', (error) => {
          console.error('[PushRegistration] Registration error:', error);
          let errorMessage = 'Could not set up push notifications.';
          if (platform === 'ios') {
            if (error.error.includes('certificate') || error.error.includes('provision')) {
              errorMessage = 'APNs certificate issue. App needs proper provisioning profile.';
            } else if (error.error.includes('simulator')) {
              errorMessage = 'Push notifications are not available in iOS Simulator.';
            }
          }
          toast({ title: 'Push Notification Error', description: errorMessage, variant: 'destructive' });
        });

        // WR-01: check cancelled
        if (cancelled) { regListener.remove(); recvListener.remove(); actionListener.remove(); tapListener.remove(); errListener.remove(); return; }

        cleanupFn = () => {
          cancelled = true;
          regListener.remove();
          recvListener.remove();
          actionListener.remove();
          tapListener.remove();
          errListener.remove();
        };
      } catch (e) {
        console.error('[PushRegistration] Init error:', e);
      }
    };

    init();
    return () => { cleanupFn?.(); };
  }, [user]);
};

export default useNativePushRegistration;
