import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  MapPin, 
  Activity,
  Bell,
  Eye,
  MessageSquare
} from 'lucide-react';

interface RealtimeAlert {
  id: string;
  title: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'investigating' | 'false_alarm';
  address: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

interface AlertResponse {
  id: string;
  alert_id: string;
  user_id: string;
  response_type: string;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

interface RealTimeAlertFeedProps {
  onAlertClick: (alert: RealtimeAlert) => void;
  className?: string;
}

const RealTimeAlertFeed: React.FC<RealTimeAlertFeedProps> = ({ onAlertClick, className }) => {
  const { user } = useAuth();
  const [recentAlerts, setRecentAlerts] = useState<RealtimeAlert[]>([]);
  const [recentResponses, setRecentResponses] = useState<AlertResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const severityColors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
  };

  const statusColors = {
    active: 'text-red-600',
    investigating: 'text-yellow-600',
    resolved: 'text-green-600',
    false_alarm: 'text-gray-600'
  };

  useEffect(() => {
    fetchRecentActivity();
    setupRealtimeSubscriptions();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent alerts (last 24 hours)
      const { data: alertsData, error: alertsError } = await supabase
        .from('safety_alerts')
        .select(`
          *,
          profiles!safety_alerts_user_id_fkey (full_name, avatar_url)
        `)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      // Fetch recent responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('alert_responses')
        .select(`
          *,
          profiles!alert_responses_user_id_fkey (full_name, avatar_url)
        `)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (responsesError) throw responsesError;

      setRecentAlerts((alertsData as any) || []);
      setRecentResponses((responsesData as any) || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new safety alerts
    const alertsSubscription = supabase
      .channel('realtime_alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'safety_alerts' },
        async (payload) => {
          // Fetch the full alert with profile data
          const { data } = await supabase
            .from('safety_alerts')
            .select(`
              *,
              profiles!safety_alerts_user_id_fkey (full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setRecentAlerts(prev => [data as any, ...prev.slice(0, 9)]);
            
            // Show notification for new alerts
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Safety Alert', {
                body: `${data.title} - ${data.severity} severity`,
                icon: '/favicon.ico'
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to alert status updates
    const alertUpdatesSubscription = supabase
      .channel('alert_updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'safety_alerts' },
        (payload) => {
          setRecentAlerts(prev => 
            prev.map(alert => 
              alert.id === payload.new.id 
                ? { ...alert, ...payload.new }
                : alert
            )
          );
        }
      )
      .subscribe();

    // Subscribe to new alert responses
    const responsesSubscription = supabase
      .channel('alert_responses')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'alert_responses' },
        async (payload) => {
          // Fetch the full response with profile data
          const { data } = await supabase
            .from('alert_responses')
            .select(`
              *,
              profiles!alert_responses_user_id_fkey (full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setRecentResponses(prev => [data as any, ...prev.slice(0, 9)]);
          }
        }
      )
      .subscribe();

    return () => {
      alertsSubscription.unsubscribe();
      alertUpdatesSubscription.unsubscribe();
      responsesSubscription.unsubscribe();
    };
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Live Activity Feed</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={requestNotificationPermission}
            className="text-xs"
          >
            <Bell className="h-3 w-3 mr-1" />
            Enable Alerts
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {/* Recent Alerts */}
          {recentAlerts.map((alert) => (
            <div 
              key={`alert-${alert.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onAlertClick(alert)}
            >
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${severityColors[alert.severity]} absolute -top-1 -right-1 z-10`}></div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={alert.profiles?.avatar_url} />
                  <AvatarFallback>
                    <AlertTriangle className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <Badge variant="outline" className={`text-xs ${statusColors[alert.status]}`}>
                    {alert.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{alert.address || 'Location not specified'}</span>
                  <Clock className="h-3 w-3 ml-auto" />
                  <span>{getTimeSince(alert.created_at)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Recent Responses */}
          {recentResponses.map((response) => (
            <div 
              key={`response-${response.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={response.profiles?.avatar_url} />
                <AvatarFallback>
                  <MessageSquare className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  <span className="font-medium">{response.profiles?.full_name || 'Anonymous'}</span>
                  {' '}responded to an alert
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span className="truncate">{response.comment}</span>
                  <Clock className="h-3 w-3 ml-auto" />
                  <span>{getTimeSince(response.created_at)}</span>
                </div>
              </div>
            </div>
          ))}

          {recentAlerts.length === 0 && recentResponses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeAlertFeed;