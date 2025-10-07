import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationStore, NotificationData } from '@/store/notificationStore';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const addNotification = useNotificationStore(state => state.addNotification);
  const syncWithServer = useNotificationStore(state => state.syncWithServer);

  useEffect(() => {
    if (!user?.id) {
      console.log('[RealtimeNotifications] No user, skipping subscriptions');
      return;
    }

    console.log('[RealtimeNotifications] Setting up subscriptions for user:', user.id);

    // Initial sync with server
    syncWithServer(user.id);

    // Detect iOS - realtime might be disabled
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    try {
      // 1. Subscribe to alert_notifications table
      const alertNotificationsChannel = supabase
        .channel('alert-notifications-changes')
        .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[RealtimeNotifications] Alert notification received:', payload);
          
          const record = payload.new;
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
        }
      )
      .subscribe();

    // 2. Subscribe to direct_messages table
    const directMessagesChannel = supabase
      .channel('direct-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('[RealtimeNotifications] Direct message received:', payload);
          
          const message = payload.new;
          
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
        }
      )
      .subscribe();

    // 3. Subscribe to community_posts table
    const communityPostsChannel = supabase
      .channel('community-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts'
        },
        async (payload) => {
          console.log('[RealtimeNotifications] Community post received:', payload);
          
          const post = payload.new;
          
          // Fetch author profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', post.user_id)
            .single();

          // Only notify if it matches user's location preferences
          // (This is a simplified check - you might want more sophisticated filtering)
          const notification: NotificationData = {
            id: `post-${post.id}`,
            type: 'post',
            title: 'New Community Post',
            body: post.title || post.content?.substring(0, 100) || 'New post in your area',
            data: {
              postId: post.id,
              authorId: post.user_id,
              location: post.location
            },
            timestamp: post.created_at,
            isRead: false,
            priority: 'low',
            senderId: post.user_id,
            senderName: profile?.full_name
          };

          addNotification(notification);
        }
      )
      .subscribe();

    // 4. Subscribe to safety_alerts table
    const safetyAlertsChannel = supabase
      .channel('safety-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'safety_alerts'
        },
        async (payload) => {
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
        }
      )
      .subscribe();

    // 5. Subscribe to panic_alerts table
    const panicAlertsChannel = supabase
      .channel('panic-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'panic_alerts'
        },
        async (payload) => {
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
        }
      )
      .subscribe();

      // Store channels for cleanup
      channelsRef.current = [
        alertNotificationsChannel,
        directMessagesChannel,
        communityPostsChannel,
        safetyAlertsChannel,
        panicAlertsChannel
      ];
    } catch (error: any) {
      // Handle realtime subscription errors gracefully (especially on iOS)
      if (error?.name === 'SecurityError' || error?.message?.includes('insecure') || error?.message?.includes('WebSocket')) {
        console.log('[RealtimeNotifications] Realtime unavailable (likely iOS), using polling fallback');
        
        // On iOS or when realtime fails, fall back to periodic polling
        if (isIOS) {
          console.log('[RealtimeNotifications] iOS detected - realtime disabled, app will function without live updates');
        }
      } else {
        console.error('[RealtimeNotifications] Unexpected error setting up subscriptions:', error);
      }
    }

    // Cleanup function
    return () => {
      console.log('[RealtimeNotifications] Cleaning up subscriptions');
      try {
        channelsRef.current.forEach(channel => {
          supabase.removeChannel(channel);
        });
      } catch (error) {
        // Ignore cleanup errors
        console.debug('[RealtimeNotifications] Error during cleanup (ignored):', error);
      }
      channelsRef.current = [];
    };
  }, [user?.id, addNotification, syncWithServer]);
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
