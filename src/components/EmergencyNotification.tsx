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
      const subscription = supabase.channel('emergency-notifications');
      supabase.removeChannel(subscription);
    };
  }, [user]);
  
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      // Load panic alerts
      const { data: panicAlerts, error } = await supabase
        .from('alert_notifications')
        .select(`
          id,
          notification_type,
          is_read,
          sent_at,
          panic_alert_id,
          panic_alerts:panic_alert_id (
            user_id,
            latitude,
            longitude,
            address,
            message,
            situation_type,
            created_at,
            profiles:user_id (
              full_name,
              phone
            )
          )
        `)
        .eq('recipient_id', user.id)
        .eq('is_read', false)
        .order('sent_at', { ascending: false });
        
      if (error) throw error;
      
      // Load emergency contact requests with notification_sent = true
      const { data: contactRequests, error: requestsError } = await supabase
        .from('emergency_contact_requests')
        .select(`
          id,
          sender_id,
          status,
          created_at,
          notification_sent,
          profiles:sender_id (
            full_name,
            phone,
            avatar_url
          )
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .eq('notification_sent', true)
        .order('created_at', { ascending: false });
      
      if (requestsError) throw requestsError;
      
      // Format contact requests to match notification format
      const formattedRequests = (contactRequests || []).map(request => ({
        id: `request-${request.id}`,
        notification_type: 'contact_request',
        is_read: false,
        sent_at: request.created_at,
        contact_request: request,
        contact_request_id: request.id
      }));
      
      // Combine all notifications
      const allNotifications = [...(panicAlerts || []), ...formattedRequests];
      
      if (allNotifications.length > 0) {
        setNotifications(allNotifications);
        // Auto-open panel if there are unread emergency notifications
        const hasEmergencyNotifications = allNotifications.some(
          n => n.notification_type === 'panic_alert' || n.notification_type === 'contact_request'
        );
        if (hasEmergencyNotifications) setPanelOpen(true);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };
  
  const subscribeToNotifications = () => {
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
          if (payload.new) {
            loadNotifications();
            if (payload.new.notification_type === 'panic_alert') {
              // Play emergency alert sound automatically
              playNotification('emergency', 0.8);
              
              toast({
                title: "🚨 EMERGENCY ALERT",
                description: "Someone needs your help! Check your emergency notifications.",
                variant: "destructive",
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
          if (payload.new && payload.new.notification_sent) {
            loadNotifications();
            // Play normal notification sound for contact requests
            playNotification('normal', 0.5);
            
            toast({
              title: "Emergency Contact Request",
              description: "Someone has added you as their emergency contact.",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_contact_requests',
          filter: `recipient_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new && payload.new.notification_sent) {
            loadNotifications();
          }
        }
      )
      .subscribe();
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
                const alert = notification.panic_alerts;
                const sender = alert?.profiles;
                
                return (
                  <div 
                    key={notification.id} 
                    className="border border-red-200 rounded-md p-3 bg-red-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{sender?.full_name || 'Someone'} needs help!</h4>
                        <Badge className="mt-1 bg-red-600">{alert?.situation_type?.replace('_', ' ')}</Badge>
                        
                        {alert?.address && (
                          <p className="text-xs mt-2 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> 
                            {alert.address}
                          </p>
                        )}
                        
                        <div className="mt-3 flex gap-2">
                          {sender?.phone && (
                            <Button 
                              size="sm" 
                              onClick={() => callEmergencyContact(sender.phone)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <PhoneCall className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                          )}
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
              // Handle emergency contact requests
              else if (notification.notification_type === 'contact_request') {
                const request = notification.contact_request;
                const sender = request?.profiles;
                
                return (
                  <div 
                    key={notification.id} 
                    className="border border-blue-200 rounded-md p-3 bg-blue-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium flex items-center gap-1">
                          <UserPlus className="h-4 w-4 text-blue-600" />
                          Emergency Contact Request
                        </h4>
                        <p className="text-sm mt-1">
                          {sender?.full_name || 'Someone'} added you as an emergency contact
                        </p>
                        
                        <div className="mt-3 flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              // Mark as read in our UI
                              setNotifications(prev => 
                                prev.filter(n => n.id !== notification.id)
                              );
                              
                              // Navigate to settings page to handle requests
                              window.location.href = '/settings';
                              
                              // Update the request to acknowledge we've seen it
                              if (request.id) {
                                try {
                                  supabase
                                    .from('emergency_contact_requests')
                                    .update({ notification_sent: false })
                                    .eq('id', request.id);
                                } catch (err) {
                                  console.error('Error updating request:', err);
                                }
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            View Request
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              // Just dismiss the notification
                              setNotifications(prev => 
                                prev.filter(n => n.id !== notification.id)
                              );
                              
                              if (request.id) {
                                try {
                                  supabase
                                    .from('emergency_contact_requests')
                                    .update({ notification_sent: false })
                                    .eq('id', request.id);
                                } catch (err) {
                                  console.error('Error updating request:', err);
                                }
                              }
                            }}
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