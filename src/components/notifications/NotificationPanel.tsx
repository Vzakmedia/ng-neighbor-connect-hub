import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  FileText,
  Phone,
  Check,
  CheckCircle as CheckCheck,
  Trash2,
  X
} from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore, NotificationData } from '@/store/notificationStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface NotificationPanelProps {
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationPanel = ({
  onClose,
  position = 'top-right'
}: NotificationPanelProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const notifications = useNotificationStore(state => state.notifications);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);
  const deleteNotification = useNotificationStore(state => state.deleteNotification);
  const unreadCount = useNotificationStore(state => state.unreadCount);

  const [filter, setFilter] = useState<'all' | NotificationData['type']>('all');

  const filteredNotifications = notifications.filter(n =>
    !n.isRead && (filter === 'all' || n.type === filter)
  );

  const handleAcceptContactRequest = async (requestId: string, notificationId: string) => {
    try {
      const { error } = await supabase.rpc('confirm_emergency_contact_request', {
        _accept: true,
        _request_id: requestId
      });

      if (error) throw error;

      toast({
        title: 'Contact request accepted',
        description: 'You are now emergency contacts',
      });

      markAsRead(notificationId);
    } catch (error) {
      console.error('Error accepting contact request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept contact request',
        variant: 'destructive',
      });
    }
  };

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    markAsRead(notification.id);

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        if (notification.data?.conversationId) {
          navigate(`/messages?conversation=${notification.data.conversationId}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'post':
        if (notification.data?.postId) {
          navigate(`/community?post=${notification.data.postId}`);
        } else {
          navigate('/community');
        }
        break;
      case 'emergency':
      case 'alert':
      case 'panic_alert':
        navigate('/safety');
        break;
    }
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'emergency':
      case 'panic_alert':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'contact_request':
        return <UserPlus className="h-4 w-4" />;
      case 'post':
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (
    type: NotificationData['type'],
    priority: NotificationData['priority'],
    isRead: boolean
  ) => {
    if (isRead) return 'border-muted bg-muted/20';

    if (priority === 'urgent' || type === 'panic_alert' || type === 'emergency') {
      return 'border-destructive bg-destructive/10';
    }
    if (priority === 'high' || type === 'alert') {
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
    }
    return 'border-primary bg-primary/5';
  };

  const positionClasses = {
    'top-right': 'top-14 right-4',
    'top-left': 'top-14 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <Card className={`fixed ${positionClasses[position]} w-96 max-h-[600px] shadow-lg z-50 animate-in slide-in-from-top-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-1 mt-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="h-7 text-xs"
          >
            All
          </Button>
          <Button
            variant={filter === 'message' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('message')}
            className="h-7 text-xs"
          >
            Messages
          </Button>
          <Button
            variant={filter === 'alert' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('alert')}
            className="h-7 text-xs"
          >
            Alerts
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${getNotificationColor(
                    notification.type,
                    notification.priority,
                    notification.isRead
                  )}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                        })}
                      </p>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        {notification.type === 'contact_request' && notification.requestId && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAcceptContactRequest(
                              notification.requestId!,
                              notification.id
                            )}
                            className="h-7 text-xs"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                        )}
                        {notification.data?.senderPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCall(notification.data.senderPhone)}
                            className="h-7 text-xs"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        )}
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            className="h-7 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-7 text-xs ml-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
