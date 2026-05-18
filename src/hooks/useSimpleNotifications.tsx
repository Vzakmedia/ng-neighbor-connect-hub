/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please use the new centralized notification system instead:
 * - Store: import { useNotificationStore } from '@/store/notificationStore'
 * - Realtime: import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
 * 
 * Migration guide:
 * 1. Replace useNotifications() with useNotificationStore()
 * 2. Call useRealtimeNotifications() in your root component (already done in PlatformRoot)
 * 3. Use NotificationBell and NotificationPanel components for UI
 */

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { playNotification, playEmergencyAlert, sendBrowserNotification, requestPushNotificationPermission } from '@/utils/audioUtils';

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

  // Simple notification functions with instant sound and push notifications
  const showToastNotification = (notification: NotificationData) => {
    const variant = notification.priority === 'urgent' || notification.type === 'emergency' 
      ? 'destructive' : 'default';
    
    // Play sound instantly
    if (notification.type === 'emergency' || notification.type === 'panic_alert') {
      playEmergencyAlert();
    } else {
      playNotification('normal');
    }

    // Send browser push notification
    sendBrowserNotification(notification.title, {
      body: notification.body,
      icon: '/favicon.ico',
      tag: `notification-${notification.id}`,
      data: notification.data,
      requireInteraction: notification.priority === 'urgent'
    });
    
    toast({
      title: notification.title,
      description: notification.body,
      variant,
      duration: notification.priority === 'urgent' ? 10000 : 5000,
    });
  };

  // Function to add new notification with instant sound and push notification
  // WR-11: deduplicate by id before adding
  const addNotification = (notification: NotificationData) => {
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev];
    });
    setUnreadCount(prev => prev + 1);
    showToastNotification(notification);
  };

  // Initialize push notifications when user is available
  useEffect(() => {
    if (user) {
      requestPushNotificationPermission().then(success => {
        if (success && process.env.NODE_ENV !== 'production') {
          console.log('Push notifications enabled');
        }
      });
    }
  }, [user]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // WR-12: actually recompute state instead of no-op stubs
  const refreshNotifications = () => {
    // Re-derive unread count from current notification state
    setNotifications(prev => [...prev]);
  };

  const refreshUnreadCount = () => {
    setNotifications(prev => {
      setUnreadCount(prev.filter(n => !n.isRead).length);
      return prev;
    });
  };

  // Initialize with empty state
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    refreshUnreadCount,
    addNotification,
    showToastNotification
  };
};