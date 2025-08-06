import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createSafeSubscription } from '@/utils/realtimeUtils';
import { playNotification } from '@/utils/audioUtils';
import { useToast } from '@/hooks/use-toast';

export interface NotificationData {
  id: string;
  type: 'message' | 'emergency' | 'alert' | 'contact_request' | 'panic_alert';
  title: string;
  body: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const windowHasFocusRef = useRef(true);
  const isInitializedRef = useRef(false);
  const previousUnreadCountRef = useRef(0);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return Notification.permission === 'granted';
  };

  // Show browser notification
  const showBrowserNotification = (notification: NotificationData) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const browserNotification = new Notification(notification.title, {
      body: notification.body,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      silent: false
    });

    // Auto close after 5 seconds unless urgent
    if (notification.priority !== 'urgent') {
      setTimeout(() => browserNotification.close(), 5000);
    }

    // Handle click
    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
    };
  };

  // Play notification sound
  const playNotificationSound = (type: NotificationData['type'], priority: NotificationData['priority']) => {
    try {
      const audioSettings = JSON.parse(localStorage.getItem('audioSettings') || '{}');
      const soundEnabled = audioSettings.soundEnabled !== false;
      
      if (!soundEnabled) return;

      if (type === 'emergency' || type === 'panic_alert' || priority === 'urgent') {
        playNotification('emergency');
      } else {
        playNotification('notification');
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Show toast notification
  const showToastNotification = (notification: NotificationData) => {
    const variant = notification.priority === 'urgent' || notification.type === 'emergency' 
      ? 'destructive' : 'default';
    
    toast({
      title: notification.title,
      description: notification.body,
      variant,
      duration: notification.priority === 'urgent' ? 10000 : 5000,
    });
  };

  // Process new notification
  const processNotification = (notification: NotificationData) => {
    console.log('Processing notification:', notification);

    // Add to notifications list
    setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep only 100 notifications

    // Only show notifications if app is initialized and window has focus
    if (isInitializedRef.current && windowHasFocusRef.current) {
      playNotificationSound(notification.type, notification.priority);
      showToastNotification(notification);
    }

    // Always show browser notification for urgent notifications
    if (notification.priority === 'urgent' || notification.type === 'emergency') {
      showBrowserNotification(notification);
    }
  };

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const { data: conversations, error } = await supabase
        .from('direct_conversations')
        .select('user1_id, user2_id, user1_has_unread, user2_has_unread')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      let totalUnread = 0;
      conversations?.forEach(conv => {
        if (conv.user1_id === user.id && conv.user1_has_unread) {
          totalUnread++;
        } else if (conv.user2_id === user.id && conv.user2_has_unread) {
          totalUnread++;
        }
      });

      // Check if we have new messages
      if (totalUnread > previousUnreadCountRef.current && isInitializedRef.current) {
        const newMessageNotification: NotificationData = {
          id: `message-${Date.now()}`,
          type: 'message',
          title: 'New Message',
          body: `You have ${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'normal'
        };
        processNotification(newMessageNotification);
      }

      previousUnreadCountRef.current = totalUnread;
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('alert_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      const formattedNotifications: NotificationData[] = data?.map(notification => ({
        id: notification.id,
        type: notification.notification_type as NotificationData['type'],
        title: notification.notification_type === 'panic_alert' ? 'Emergency Alert' : 
               notification.notification_type === 'contact_request' ? 'Emergency Contact Request' : 
               'Alert',
        body: notification.content,
        data: {
          sender_name: notification.sender_name,
          sender_phone: notification.sender_phone,
          request_id: notification.request_id,
          panic_alert_id: notification.panic_alert_id,
          alert_id: notification.alert_id,
        },
        timestamp: notification.sent_at,
        isRead: notification.is_read,
        priority: notification.notification_type === 'panic_alert' ? 'urgent' : 'normal'
      })) || [];

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Update in database
      await supabase
        .from('alert_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      // Update all notifications for this user to read
      await supabase
        .from('alert_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Initialize notifications
  useEffect(() => {
    if (!user) return;

    // Request notification permission
    requestNotificationPermission().then(granted => {
      if (granted) {
        console.log('Notification permission granted');
      }
    });

    // Track window focus state
    const handleFocus = () => {
      windowHasFocusRef.current = true;
    };
    
    const handleBlur = () => {
      windowHasFocusRef.current = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initialize audio context on user interaction
    const initializeAudio = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
        }
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
      
      document.removeEventListener('click', initializeAudio);
      document.removeEventListener('touchstart', initializeAudio);
    };

    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });

    // Fetch initial data
    const initializeFetch = async () => {
      if (!user) return;
      
      // Fetch unread count
      try {
        const { data: conversations } = await supabase
          .from('direct_conversations')
          .select('user1_id, user2_id, user1_has_unread, user2_has_unread')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

        let totalUnread = 0;
        conversations?.forEach(conv => {
          if (conv.user1_id === user.id && conv.user1_has_unread) totalUnread++;
          else if (conv.user2_id === user.id && conv.user2_has_unread) totalUnread++;
        });
        
        setUnreadCount(totalUnread);
        previousUnreadCountRef.current = totalUnread;
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    initializeFetch();

    // Set up real-time subscriptions
    const messageSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}`
        }, () => {
          fetchUnreadCount();
        }),
      {
        channelName: 'unified-message-notifications',
        onError: () => console.log('Message subscription error'),
        pollInterval: 60000,
        debugName: 'UnifiedNotifications-messages'
      }
    );

    const conversationSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'direct_conversations',
          filter: `user1_id=eq.${user.id}`
        }, () => {
          // Inline fetch to avoid circular dependency
          if (user) {
            supabase
              .from('direct_conversations')
              .select('user1_id, user2_id, user1_has_unread, user2_has_unread')
              .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
              .then(({ data }) => {
                let totalUnread = 0;
                data?.forEach(conv => {
                  if (conv.user1_id === user.id && conv.user1_has_unread) totalUnread++;
                  else if (conv.user2_id === user.id && conv.user2_has_unread) totalUnread++;
                });
                setUnreadCount(totalUnread);
              });
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'direct_conversations',
          filter: `user2_id=eq.${user.id}`
        }, () => {
          fetchUnreadCount();
        }),
      {
        channelName: 'unified-conversation-notifications',
        onError: () => console.log('Conversation subscription error'),
        pollInterval: 120000,
        debugName: 'UnifiedNotifications-conversations'
      }
    );

    const alertSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('New alert notification:', payload);
          const newRecord = payload.new as any;
          const notification: NotificationData = {
            id: newRecord.id,
            type: newRecord.notification_type,
            title: newRecord.notification_type === 'panic_alert' ? 'Emergency Alert' :
                   newRecord.notification_type === 'contact_request' ? 'Emergency Contact Request' :
                   'Alert',
            body: newRecord.content,
            data: {
              sender_name: newRecord.sender_name,
              sender_phone: newRecord.sender_phone,
              request_id: newRecord.request_id,
              panic_alert_id: newRecord.panic_alert_id,
              alert_id: newRecord.alert_id,
            },
            timestamp: newRecord.sent_at,
            isRead: false,
            priority: newRecord.notification_type === 'panic_alert' ? 'urgent' : 'normal'
          };
          processNotification(notification);
        }),
      {
        channelName: 'unified-alert-notifications',
        onError: () => console.log('Alert subscription error'),
        pollInterval: 30000,
        debugName: 'UnifiedNotifications-alerts'
      }
    );

    // Mark as initialized after delay
    setTimeout(() => {
      isInitializedRef.current = true;
    }, 2000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      messageSubscription?.unsubscribe();
      conversationSubscription?.unsubscribe();
      alertSubscription?.unsubscribe();
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
    refreshUnreadCount: fetchUnreadCount
  };
};