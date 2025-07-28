import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { X, Bell, Check, Phone, UserPlus, AlertTriangle, MessageSquare, Users, Calendar, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { playNotification } from '@/utils/audioUtils';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left';
}

interface Notification {
  id: string;
  notification_type: string;
  content: string;
  sender_name?: string;
  sender_phone?: string;
  request_id?: string;
  panic_alert_id?: string;
  alert_id?: string;
  sent_at: string;
  is_read: boolean;
}

const NotificationPanel = ({ isOpen, onClose, position = 'top-right' }: NotificationPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      subscribeToNotifications();
    }
    
    return () => {
      cleanupSafeSubscription('notification-panel', 'NotificationPanel');
    };
  }, [user]);

  // Load notifications only when panel opens
  useEffect(() => {
    if (user && isOpen) {
      loadNotifications();
    }
  }, [user, isOpen]);

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alert_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    createSafeSubscription(
      (channel) => channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'alert_notifications',
            filter: `recipient_id=eq.${user?.id}`
          },
          (payload) => {
            console.log('New notification received:', payload);
            if (payload.new) {
              const newNotification = payload.new as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              
              // Play appropriate sound based on notification type
              if (newNotification.notification_type === 'panic_alert') {
                playNotification('emergency', 0.8);
                toast({
                  title: "🚨 EMERGENCY ALERT",
                  description: "Someone needs your help! Check your notifications.",
                  variant: "destructive",
                });
              } else if (newNotification.notification_type === 'contact_request') {
                playNotification('notification', 0.5);
                toast({
                  title: "New Contact Request",
                  description: `${newNotification.sender_name || 'Someone'} wants to add you as an emergency contact.`,
                });
              } else if (newNotification.notification_type === 'message') {
                playNotification('notification', 0.4);
                toast({
                  title: "New Message",
                  description: `${newNotification.sender_name || 'Someone'} sent you a message.`,
                });
              } else {
                playNotification('normal', 0.3);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'alert_notifications',
            filter: `recipient_id=eq.${user?.id}`
          },
          () => {
            loadNotifications();
          }
        ),
      {
        channelName: 'notification-panel',
        onError: loadNotifications,
        pollInterval: 30000,
        debugName: 'NotificationPanel'
      }
    );
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('alert_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);
        
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.rpc('mark_all_notifications_as_read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been cleared.",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const confirmContactRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contact_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Mark the notification as read
      const notification = notifications.find(n => n.request_id === requestId);
      if (notification) {
        await markAsRead(notification.id);
      }
      
      toast({
        title: "Contact Request Accepted",
        description: "You have been added as an emergency contact.",
      });
    } catch (error) {
      console.error('Error accepting contact request:', error);
      toast({
        title: "Error",
        description: "Failed to accept contact request.",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'panic_alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'contact_request':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'marketplace':
        return <ShoppingBag className="h-4 w-4 text-orange-500" />;
      case 'community':
        return <Users className="h-4 w-4 text-cyan-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    const baseOpacity = isRead ? 'opacity-60' : '';
    switch (type) {
      case 'panic_alert':
        return `border-red-200 bg-red-50 ${baseOpacity}`;
      case 'contact_request':
        return `border-blue-200 bg-blue-50 ${baseOpacity}`;
      case 'message':
        return `border-green-200 bg-green-50 ${baseOpacity}`;
      case 'event':
        return `border-purple-200 bg-purple-50 ${baseOpacity}`;
      case 'marketplace':
        return `border-orange-200 bg-orange-50 ${baseOpacity}`;
      case 'community':
        return `border-cyan-200 bg-cyan-50 ${baseOpacity}`;
      default:
        return `border-gray-200 bg-gray-50 ${baseOpacity}`;
    }
  };

  const positionClasses = position === 'top-right' 
    ? 'top-16 right-4' 
    : 'top-16 left-4';

  if (!isOpen) return null;

  return (
    <div ref={panelRef} className={`fixed ${positionClasses} z-50 w-96 max-w-[calc(100vw-2rem)]`}>
      <Card className="shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-lg">Notifications</CardTitle>
              {notifications.filter(n => !n.is_read).length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {notifications.filter(n => !n.is_read).length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.some(n => !n.is_read) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs px-2"
                >
                  Mark all read
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div 
                      className={`p-3 rounded-lg border transition-all ${getNotificationColor(notification.notification_type, notification.is_read)}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getNotificationIcon(notification.notification_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {notification.sender_name && (
                                <span className="font-medium text-sm">
                                  {notification.sender_name}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.sent_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 break-words">
                              {notification.content}
                            </p>
                            
                            {notification.notification_type === 'contact_request' && notification.request_id && (
                              <div className="flex gap-2 mt-2">
                                <Button 
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-xs"
                                  onClick={() => confirmContactRequest(notification.request_id!)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            )}
                            
                            {notification.notification_type === 'panic_alert' && (
                              <div className="flex gap-2 mt-2">
                                {notification.sender_phone && (
                                  <Button 
                                    size="sm"
                                    variant="destructive"
                                    className="text-xs"
                                    onClick={() => window.location.href = `tel:${notification.sender_phone}`}
                                  >
                                    <Phone className="h-3 w-3 mr-1" />
                                    Call
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            )}
                            
                            {!['contact_request', 'panic_alert'].includes(notification.notification_type) && !notification.is_read && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="mt-2 text-xs p-1 h-auto"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPanel;