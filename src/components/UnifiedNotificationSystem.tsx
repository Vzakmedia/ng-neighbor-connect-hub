import React, { useState } from 'react';
import { Bell, X, Phone, Check, AlertTriangle, MessageSquare, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, NotificationData } from '@/hooks/useSimpleNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedNotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const UnifiedNotificationSystem = ({ 
  position = 'top-right' 
}: UnifiedNotificationSystemProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const handleContactRequest = async (requestId: string, notificationId: string) => {
    try {
      const { data, error } = await supabase.rpc('confirm_emergency_contact_request', {
        _request_id: requestId,
        _accept: true
      });

      if (error) throw error;
      
      await markAsRead(notificationId);
      
      toast({
        title: "Contact Request Accepted",
        description: "You are now listed as an emergency contact.",
      });
    } catch (error) {
      console.error('Error accepting contact request:', error);
      toast({
        title: "Error",
        description: "Failed to accept contact request.",
        variant: "destructive",
      });
    }
  };

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    }
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'emergency':
      case 'panic_alert':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'contact_request':
        return <Shield className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: NotificationData['type'], priority: NotificationData['priority'], isRead: boolean) => {
    if (isRead) return 'border-muted bg-muted/20';
    
    switch (priority) {
      case 'urgent':
        return 'border-destructive bg-destructive/10';
      case 'high':
        return 'border-warning bg-warning/10';
      default:
        return 'border-primary bg-primary/5';
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Notification Bell Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative shadow-lg"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="mt-2 w-80 max-h-96 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notifications
              {unreadNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadNotifications.length}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              {unreadNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-6 px-2"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 ${getNotificationColor(notification.type, notification.priority, notification.isRead)} hover:bg-muted/50 transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              {notification.priority === 'urgent' && (
                                <Badge variant="destructive" className="text-xs">
                                  URGENT
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {notification.body}
                            </p>
                            {notification.data?.sender_name && (
                              <p className="text-xs text-muted-foreground mb-2">
                                From: {notification.data.sender_name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 mt-2">
                        {notification.type === 'contact_request' && notification.data?.request_id && (
                          <Button
                            size="sm"
                            onClick={() => handleContactRequest(notification.data.request_id, notification.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                        )}
                        
                        {notification.data?.sender_phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCall(notification.data.sender_phone)}
                            className="h-6 px-2 text-xs"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        )}
                        
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 px-2 text-xs ml-auto"
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};