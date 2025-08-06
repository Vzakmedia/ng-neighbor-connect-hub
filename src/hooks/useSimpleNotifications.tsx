import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

  // Simple notification functions
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

  const refreshNotifications = () => {
    // Placeholder for refreshing notifications
    console.log('Refreshing notifications...');
  };

  const refreshUnreadCount = () => {
    // Placeholder for refreshing unread count
    console.log('Refreshing unread count...');
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
    refreshUnreadCount
  };
};