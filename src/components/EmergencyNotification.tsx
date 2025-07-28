import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, MapPin, X, Bell, PhoneCall, UserPlus, Check, Mails } from 'lucide-react';
import { playNotification } from '@/utils/audioUtils';

interface EmergencyNotificationProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

const EmergencyNotification = ({ position = 'top-right' }: EmergencyNotificationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
    
    return () => {
      try {
        const subscription = supabase.channel('emergency-notifications');
        supabase.removeChannel(subscription);
        
        // Clear polling fallback if it exists
        if ((window as any).emergencyNotificationPoll) {
          clearInterval((window as any).emergencyNotificationPoll);
          delete (window as any).emergencyNotificationPoll;
        }
      } catch (error) {
        console.error('Error cleaning up subscriptions:', error);
      }
    };
  }, [user]);
  
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      // Load notifications with proper foreign key handling
      const { data, error } = await supabase
        .from('alert_notifications')
        .select(`
          id,
          notification_type,
          is_read,
          sent_at,
          panic_alert_id,
          sender_name,
          sender_phone,
          content,
          request_id
        `)
        .eq('recipient_id', user.id)
        .eq('is_read', false)
        .order('sent_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setNotifications(data);
        // Auto-open panel if there are unread notifications
        setPanelOpen(true);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };
  
  const subscribeToNotifications = () => {
    try {
      const subscription = supabase.channel('emergency-notifications')
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
              loadNotifications();
              
              // Handle different notification types
              if (payload.new.notification_type === 'panic_alert') {
                // Play emergency alert sound automatically
                playNotification('emergency', 0.8);
                
                toast({
                  title: "🚨 EMERGENCY ALERT",
                  description: "Someone needs your help! Check your emergency notifications.",
                  variant: "destructive",
                });
              } else if (payload.new.notification_type === 'contact_request') {
                // Play a different sound for contact requests
                playNotification('notification', 0.5);
                
                toast({
                  title: "New Contact Request",
                  description: `${payload.new.sender_name || 'Someone'} wants to add you as an emergency contact.`,
                });
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'panic_alerts'
          },
          () => {
            loadNotifications();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'emergency_contact_requests',
            filter: `recipient_id=eq.${user?.id}`
          },
          (payload) => {
            console.log('New contact request received:', payload);
            toast({
              title: "Emergency Contact Request",
              description: "Someone wants to add you as an emergency contact.",
            });
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to emergency notifications - falling back to polling');
            // Fallback to polling every 30 seconds
            const pollInterval = setInterval(() => {
              loadNotifications();
            }, 30000);
            
            // Store interval for cleanup
            (window as any).emergencyNotificationPoll = pollInterval;
          }
        });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      // Fallback to polling every 30 seconds
      const pollInterval = setInterval(() => {
        loadNotifications();
      }, 30000);
      
      // Store interval for cleanup
      (window as any).emergencyNotificationPoll = pollInterval;
    }
  };
  
  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('alert_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);
        
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notifications.length <= 1) {
        setPanelOpen(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const callEmergencyContact = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };
  
  const confirmContactRequest = async (requestId: string) => {
    if (!user || !requestId) return;
    
    try {
      // Update the request status to 'accepted'
      const { error } = await supabase
        .from('emergency_contact_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Find and mark the notification as read
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
  
  if (!user || notifications.length === 0) return null;
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {!panelOpen && (
        <Button 
          onClick={() => setPanelOpen(true)}
          variant="destructive"
          className="rounded-full"
        >
          <Bell className="h-5 w-5 mr-2" />
          {notifications.length} {notifications.length === 1 ? 'Alert' : 'Alerts'}
        </Button>
      )}
      
      {panelOpen && (
        <Card className="w-80 shadow-lg border-red-200 bg-white">
          <div className="flex items-center justify-between p-3 bg-red-50 border-b border-red-200">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Emergency Alerts
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setPanelOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardContent className="p-3 max-h-[70vh] overflow-y-auto space-y-3">
            {notifications.map((notification) => {
              // Handle different notification types
              if (notification.notification_type === 'panic_alert') {
                // Display panic alert notification (simplified)
                return (
                  <div 
                    key={notification.id} 
                    className="border border-red-200 rounded-md p-3 bg-red-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Emergency Alert</h4>
                        <Badge className="mt-1 bg-red-600">Emergency</Badge>
                        
                        <div className="mt-3 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(notification.sent_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              } else if (notification.notification_type === 'contact_request') {
                // Display contact request notification
                return (
                  <div 
                    key={notification.id} 
                    className="border border-blue-200 rounded-md p-3 bg-blue-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Contact Request</h4>
                        <p className="text-sm mt-1">
                          {notification.sender_name || 'Someone'} wants to add you as an emergency contact
                        </p>
                        
                        {notification.sender_phone && (
                          <p className="text-xs mt-2 flex items-center gap-1">
                            <PhoneCall className="h-3 w-3" /> 
                            {notification.sender_phone}
                          </p>
                        )}
                        
                        <div className="mt-3 flex gap-2">
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => confirmContactRequest(notification.request_id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(notification.sent_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              }
              
              // Default case for unknown notification types
              return null;
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmergencyNotification;