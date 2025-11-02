import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationStore, NotificationData } from '@/store/notificationStore';
import { useRealtimeContext } from '@/contexts/RealtimeContext';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { onAlert, onMessage, onSafetyAlert, onPanicAlert } = useRealtimeContext();
  const addNotification = useNotificationStore(state => state.addNotification);
  const syncWithServer = useNotificationStore(state => state.syncWithServer);

  useEffect(() => {
    if (!user?.id) {
      console.log('[RealtimeNotifications] No user, skipping subscriptions');
      return;
    }

    console.log('[RealtimeNotifications] Using unified subscriptions for user:', user.id);

    // Initial sync with server
    syncWithServer(user.id);

    // Subscribe to alert notification events
    const unsubscribeAlerts = onAlert((payload) => {
      console.log('[RealtimeNotifications] Alert notification received:', payload);
      
      const record = payload.new;
      
      // Only process alerts for this user
      if (record.recipient_id !== user.id) return;
      
      const notification: NotificationData = {
        id: record.id,
        type: mapNotificationType(record.notification_type),
        title: record.sender_name || 'New Notification',
        body: record.content || '',
        data: {
          alertId: record.alert_id,
          panicAlertId: record.panic_alert_id,
          requestId: record.request_id,
          senderPhone: record.sender_phone
        },
        timestamp: record.sent_at,
        isRead: false,
        priority: determinePriority(record.notification_type),
        senderId: record.alert_id || record.panic_alert_id,
        senderName: record.sender_name || undefined,
        alertId: record.alert_id || undefined,
        panicAlertId: record.panic_alert_id || undefined,
        requestId: record.request_id || undefined
      };

      addNotification(notification);
    });

    // Subscribe to direct message events
    const unsubscribeMessages = onMessage(async (payload) => {
      console.log('[RealtimeNotifications] Direct message received:', payload);
      
      const message = payload.new;
      
      // Only process messages for this user
      if (message.recipient_id !== user.id) return;
      
      // Fetch sender profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', message.sender_id)
        .single();

      const notification: NotificationData = {
        id: `msg-${message.id}`,
        type: 'message',
        title: profile?.full_name || 'New Message',
        body: message.content?.substring(0, 100) || 'You have a new message',
        data: {
          messageId: message.id,
          conversationId: message.conversation_id,
          senderId: message.sender_id,
          senderAvatar: profile?.avatar_url
        },
        timestamp: message.created_at,
        isRead: false,
        priority: 'normal',
        senderId: message.sender_id,
        senderName: profile?.full_name
      };

      addNotification(notification);
    });

    // Subscribe to safety alert events
    const unsubscribeSafetyAlerts = onSafetyAlert(async (payload) => {
      console.log('[RealtimeNotifications] Safety alert received:', payload);
      
      const alert = payload.new;
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', alert.user_id)
        .single();

      const notification: NotificationData = {
        id: `alert-${alert.id}`,
        type: 'alert',
        title: `Safety Alert: ${alert.alert_type}`,
        body: alert.description || 'New safety alert in your area',
        data: {
          alertId: alert.id,
          alertType: alert.alert_type,
          severity: alert.severity,
          latitude: alert.latitude,
          longitude: alert.longitude,
          address: alert.address
        },
        timestamp: alert.created_at,
        isRead: false,
        priority: alert.severity === 'critical' ? 'urgent' : 'high',
        senderId: alert.user_id,
        senderName: profile?.full_name,
        alertId: alert.id
      };

      addNotification(notification);
    });

    // Subscribe to panic alert events
    const unsubscribePanicAlerts = onPanicAlert(async (payload) => {
      console.log('[RealtimeNotifications] Panic alert received:', payload);
      
      const alert = payload.new;
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', alert.user_id)
        .single();

      const notification: NotificationData = {
        id: `panic-${alert.id}`,
        type: 'panic_alert',
        title: '🚨 EMERGENCY: Panic Alert',
        body: `${profile?.full_name || 'Someone'} has triggered a panic alert`,
        data: {
          panicAlertId: alert.id,
          userId: alert.user_id,
          latitude: alert.latitude,
          longitude: alert.longitude,
          address: alert.address,
          phone: profile?.phone
        },
        timestamp: alert.created_at,
        isRead: false,
        priority: 'urgent',
        senderId: alert.user_id,
        senderName: profile?.full_name,
        panicAlertId: alert.id
      };

      addNotification(notification);
    });

    // Cleanup function
    return () => {
      console.log('[RealtimeNotifications] Cleaning up unified subscriptions');
      unsubscribeAlerts();
      unsubscribeMessages();
      unsubscribeSafetyAlerts();
      unsubscribePanicAlerts();
    };
  }, [user?.id, onAlert, onMessage, onSafetyAlert, onPanicAlert, addNotification, syncWithServer]);
};

// Helper functions
function mapNotificationType(dbType: string): NotificationData['type'] {
  const typeMap: Record<string, NotificationData['type']> = {
    'message': 'message',
    'direct_message': 'message',
    'emergency': 'emergency',
    'emergency_alert': 'emergency',
    'alert': 'alert',
    'safety_alert': 'alert',
    'contact_request': 'contact_request',
    'emergency_contact_request': 'contact_request',
    'panic_alert': 'panic_alert',
    'post': 'post',
    'community_post': 'post',
    'system': 'system'
  };

  return typeMap[dbType] || 'system';
}

function determinePriority(notificationType: string): NotificationData['priority'] {
  if (notificationType.includes('panic') || notificationType.includes('emergency')) {
    return 'urgent';
  }
  if (notificationType.includes('alert')) {
    return 'high';
  }
  return 'normal';
}
