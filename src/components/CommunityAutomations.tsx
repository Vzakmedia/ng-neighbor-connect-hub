import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  MapPin, 
  Clock, 
  Shield, 
  TrendingUp, 
  Users, 
  Calendar,
  MessageSquare,
  Settings
} from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  icon: any;
  isActive: boolean;
  category: 'safety' | 'community' | 'notifications' | 'events';
  triggers: string[];
}

const CommunityAutomations = () => {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: 'safety-alerts',
      name: 'Safety Alert Notifications',
      description: 'Automatically notify when safety incidents are reported nearby',
      icon: Shield,
      isActive: true,
      category: 'safety',
      triggers: ['incident_reported', 'emergency_alert']
    },
    {
      id: 'event-reminders',
      name: 'Event Reminders',
      description: 'Send reminders for community events you\'re interested in',
      icon: Calendar,
      isActive: true,
      category: 'events',
      triggers: ['event_created', '24h_before_event']
    },
    {
      id: 'trending-topics',
      name: 'Trending Topic Alerts',
      description: 'Notify when topics you follow start trending in your area',
      icon: TrendingUp,
      isActive: false,
      category: 'community',
      triggers: ['topic_trending', 'high_engagement']
    },
    {
      id: 'neighbor-activity',
      name: 'Neighbor Activity Digest',
      description: 'Weekly summary of your immediate neighbors\' posts and activities',
      icon: Users,
      isActive: true,
      category: 'community',
      triggers: ['weekly_digest']
    },
    {
      id: 'location-updates',
      name: 'Location-Based Updates',
      description: 'Get notified about posts and events within 500m of your location',
      icon: MapPin,
      isActive: false,
      category: 'notifications',
      triggers: ['nearby_post', 'location_event']
    },
    {
      id: 'response-automation',
      name: 'Auto-Response for Help Requests',
      description: 'Automatically share your availability for community help requests',
      icon: MessageSquare,
      isActive: false,
      category: 'community',
      triggers: ['help_request_posted']
    }
  ]);

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(automation => 
      automation.id === id 
        ? { ...automation, isActive: !automation.isActive }
        : automation
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety':
        return 'text-destructive';
      case 'community':
        return 'text-primary';
      case 'notifications':
        return 'text-secondary';
      case 'events':
        return 'text-community-yellow';
      default:
        return 'text-muted-foreground';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'safety':
        return { variant: 'destructive' as const, label: 'Safety' };
      case 'community':
        return { variant: 'default' as const, label: 'Community' };
      case 'notifications':
        return { variant: 'secondary' as const, label: 'Notifications' };
      case 'events':
        return { variant: 'outline' as const, label: 'Events' };
      default:
        return { variant: 'outline' as const, label: 'Other' };
    }
  };

  const activeAutomations = automations.filter(a => a.isActive).length;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-primary" />
            Community Automations
          </CardTitle>
          <Badge variant="secondary">
            {activeAutomations} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {automations.map((automation) => {
            const Icon = automation.icon;
            const categoryBadge = getCategoryBadge(automation.category);
            
            return (
              <div key={automation.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-start space-x-3 flex-1">
                  <Icon className={`h-5 w-5 mt-0.5 ${getCategoryColor(automation.category)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm">{automation.name}</h4>
                      <Badge variant={categoryBadge.variant} className="text-xs">
                        {categoryBadge.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {automation.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Triggers: {automation.triggers.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={automation.isActive}
                  onCheckedChange={() => toggleAutomation(automation.id)}
                  className="ml-3"
                />
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span>Smart notifications keep you connected to your community</span>
            </div>
            <Button variant="outline" size="sm">
              Manage All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityAutomations;