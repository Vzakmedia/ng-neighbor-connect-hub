import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { playNotification, playEmergencyAlert, sendBrowserNotification } from '@/utils/audioUtils';
import { shouldShowNotification, getNotificationPreferencesCache } from '@/hooks/useNotificationPreferences';

export interface NotificationData {
  id: string;
  type: 'message' | 'emergency' | 'alert' | 'contact_request' | 'panic_alert' | 'post' | 'system';
  title: string;
  body: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  senderId?: string;
  senderName?: string;
  alertId?: string;
  panicAlertId?: string;
  requestId?: string;
}

interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  lastSyncTime: number;
  
  // Actions
  addNotification: (notification: NotificationData) => void;
  setNotifications: (notifications: NotificationData[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  syncWithServer: (userId: string) => Promise<void>;
  persistReadStatus: (id: string) => Promise<void>;
  persistAllReadStatus: () => Promise<void>;
  cleanup: () => void;
}

const MAX_NOTIFICATIONS = 100;
const CLEANUP_DAYS = 30;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      lastSyncTime: 0,

      addNotification: async (notification) => {
        const { notifications } = get();
        
        // Deduplication: check if notification already exists
        const exists = notifications.some(n => n.id === notification.id);
        if (exists) {
          console.log('[NotificationStore] Duplicate notification prevented:', notification.id);
          return;
        }

        // Add to beginning of array
        const updated = [notification, ...notifications].slice(0, MAX_NOTIFICATIONS);
        const unreadCount = updated.filter(n => !n.isRead).length;

        set({ 
          notifications: updated, 
          unreadCount,
          lastSyncTime: Date.now()
        });

        // Check user preferences before playing sound/showing notifications
        if (!notification.isRead) {
          try {
            const prefs = await shouldShowNotification(notification.type, notification.priority);
            
            // Play sound based on preferences
            if (prefs.playSound) {
              if (notification.type === 'emergency' || notification.type === 'panic_alert') {
                playEmergencyAlert();
              } else {
                playNotification('normal');
              }
            }

            // Show browser notification based on preferences
            if (prefs.showBrowserNotification) {
              sendBrowserNotification(notification.title, {
                body: notification.body,
                icon: '/favicon.ico',
                tag: `notification-${notification.id}`,
                data: notification.data,
                requireInteraction: notification.priority === 'urgent'
              });
            }

            // Trigger email notification asynchronously (don't block)
            triggerEmailNotification(notification).catch(error => {
              console.error('[NotificationStore] Email send failed:', error);
            });
          } catch (error) {
            console.error('[NotificationStore] Error checking preferences:', error);
            // Fallback to showing notifications if preference check fails
            if (notification.type === 'emergency' || notification.type === 'panic_alert') {
              playEmergencyAlert();
            } else {
              playNotification('normal');
            }
            sendBrowserNotification(notification.title, {
              body: notification.body,
              icon: '/favicon.ico',
              tag: `notification-${notification.id}`,
              data: notification.data,
              requireInteraction: notification.priority === 'urgent'
            });
          }
        }

        console.log('[NotificationStore] Notification added:', notification.id, 'Unread:', unreadCount);
      },

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        set({ 
          notifications, 
          unreadCount,
          lastSyncTime: Date.now()
        });
        console.log('[NotificationStore] Bulk set:', notifications.length, 'notifications');
      },

      markAsRead: (id) => {
        const { notifications } = get();
        const updated = notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        const unreadCount = updated.filter(n => !n.isRead).length;
        
        set({ notifications: updated, unreadCount });
        
        // Persist to server asynchronously
        get().persistReadStatus(id);
        
        console.log('[NotificationStore] Marked as read:', id, 'Remaining unread:', unreadCount);
      },

      markAllAsRead: () => {
        const { notifications } = get();
        const updated = notifications.map(n => ({ ...n, isRead: true }));
        
        set({ notifications: updated, unreadCount: 0 });
        
        // Persist to server asynchronously
        get().persistAllReadStatus();
        
        console.log('[NotificationStore] All marked as read');
      },

      deleteNotification: async (id) => {
        const { notifications } = get();
        const updated = notifications.filter(n => n.id !== id);
        const unreadCount = updated.filter(n => !n.isRead).length;
        
        set({ notifications: updated, unreadCount });

        // Delete from server
        try {
          const { error } = await supabase
            .from('alert_notifications')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('[NotificationStore] Failed to delete from server:', error);
          } else {
            console.log('[NotificationStore] Deleted from server:', id);
          }
        } catch (err) {
          console.error('[NotificationStore] Delete error:', err);
        }
      },

      syncWithServer: async (userId: string) => {
        console.log('[NotificationStore] Syncing with server for user:', userId);
        
        try {
          // Get user's creation date for clean slate filtering
          const { data: { user } } = await supabase.auth.getUser();
          const userCreatedAt = user?.created_at;

          let query = supabase
            .from('alert_notifications')
            .select('*')
            .eq('recipient_id', userId)
            .order('sent_at', { ascending: false })
            .limit(MAX_NOTIFICATIONS);

          // Only sync notifications sent after user creation (clean slate)
          if (userCreatedAt) {
            query = query.gte('sent_at', userCreatedAt);
          }

          const { data, error } = await query;

          if (error) {
            console.error('[NotificationStore] Sync error:', error);
            return;
          }

          if (data) {
            // Map database records to NotificationData
            const notifications: NotificationData[] = data.map(record => ({
              id: record.id,
              type: mapNotificationType(record.notification_type),
              title: record.sender_name || 'Notification',
              body: record.content || '',
              data: {
                alertId: record.alert_id,
                panicAlertId: record.panic_alert_id,
                requestId: record.request_id,
                senderPhone: record.sender_phone
              },
              timestamp: record.sent_at,
              isRead: record.is_read ?? false,
              priority: determinePriority(record.notification_type),
              senderId: record.alert_id || record.panic_alert_id,
              senderName: record.sender_name || undefined,
              alertId: record.alert_id || undefined,
              panicAlertId: record.panic_alert_id || undefined,
              requestId: record.request_id || undefined
            }));

            get().setNotifications(notifications);
            console.log('[NotificationStore] Synced', notifications.length, 'notifications');
          }
        } catch (err) {
          console.error('[NotificationStore] Sync exception:', err);
        }
      },

      persistReadStatus: async (id: string) => {
        try {
          const { error } = await supabase
            .from('alert_notifications')
            .update({ 
              is_read: true, 
              read_at: new Date().toISOString() 
            })
            .eq('id', id);

          if (error) {
            console.error('[NotificationStore] Failed to persist read status:', error);
          } else {
            console.log('[NotificationStore] Read status persisted:', id);
          }
        } catch (err) {
          console.error('[NotificationStore] Persist error:', err);
        }
      },

      persistAllReadStatus: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase.rpc('mark_all_notifications_as_read');

          if (error) {
            console.error('[NotificationStore] Failed to mark all as read:', error);
          } else {
            console.log('[NotificationStore] All notifications marked as read on server');
          }
        } catch (err) {
          console.error('[NotificationStore] Mark all read error:', err);
        }
      },

      cleanup: () => {
        const { notifications } = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);
        const cutoffTime = cutoffDate.getTime();

        const cleaned = notifications.filter(n => {
          const notificationTime = new Date(n.timestamp).getTime();
          return notificationTime > cutoffTime;
        });

        if (cleaned.length < notifications.length) {
          const unreadCount = cleaned.filter(n => !n.isRead).length;
          set({ notifications: cleaned, unreadCount });
          console.log('[NotificationStore] Cleaned up old notifications:', notifications.length - cleaned.length);
        }
      }
    }),
    {
      name: 'ng-notifications-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        lastSyncTime: state.lastSyncTime
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[NotificationStore] Rehydrated from storage:', state.notifications.length, 'notifications');
          // Cleanup old notifications on load
          state.cleanup();
        }
      }
    }
  )
);

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
  
  return 'normal';
}

// Email notification helpers
async function triggerEmailNotification(notification: NotificationData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    
    // Map notification type to email type
    const emailType = mapNotificationTypeToEmailType(notification.type);
    
    // Generate email content
    const subject = generateEmailSubject(notification);
    const body = generateEmailBody(notification, emailType);
    
    // Call edge function (fire and forget)
    await supabase.functions.invoke('send-email-notification', {
      body: {
        to: user.email,
        subject,
        body,
        type: emailType,
        userId: user.id
      }
    });
    
    console.log('[NotificationStore] Email notification triggered for:', notification.id);
  } catch (error) {
    console.error('[NotificationStore] Email trigger error:', error);
  }
}

function mapNotificationTypeToEmailType(type: NotificationData['type']): string {
  const mapping: Record<NotificationData['type'], string> = {
    'emergency': 'emergency_alert',
    'panic_alert': 'panic_alert',
    'alert': 'safety_alert',
    'message': 'message',
    'contact_request': 'contact_request',
    'post': 'community_post',
    'system': 'system'
  };
  return mapping[type] || 'notification';
}

function generateEmailSubject(notification: NotificationData): string {
  const prefix = notification.priority === 'urgent' ? '🚨 URGENT: ' : '';
  return `${prefix}${notification.title}`;
}

function generateEmailBody(notification: NotificationData, emailType: string): string {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;
  
  return `
    <div style="${baseStyle}">
      <h2>${notification.title}</h2>
      <p>${notification.body}</p>
      <a href="${window.location.origin}" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin-top: 16px;">
        Open App
      </a>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;"/>
      <p style="color: #666; font-size: 12px;">
        You received this email because you have email notifications enabled.
        <a href="${window.location.origin}/settings">Manage preferences</a>
      </p>
    </div>
  `;
}
