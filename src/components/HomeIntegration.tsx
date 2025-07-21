import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  ArrowRight, 
  Zap, 
  Bell, 
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  ShoppingBag
} from 'lucide-react';

interface HomeAction {
  id: string;
  title: string;
  description: string;
  source: 'home' | 'community';
  type: 'post' | 'event' | 'marketplace' | 'safety';
  timestamp: string;
  actionUrl: string;
  priority: 'high' | 'medium' | 'low';
}

const HomeIntegration = () => {
  const [actions, setActions] = useState<HomeAction[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Simulate real-time sync between home and community
  useEffect(() => {
    const sampleActions: HomeAction[] = [
      {
        id: '1',
        title: 'New post from your area',
        description: 'Someone posted about a lost pet near your location',
        source: 'home',
        type: 'post',
        timestamp: '5 minutes ago',
        actionUrl: '/community',
        priority: 'medium'
      },
      {
        id: '2',
        title: 'Event reminder activated',
        description: 'Community cleanup event tomorrow - automation set reminder',
        source: 'community',
        type: 'event',
        timestamp: '10 minutes ago',
        actionUrl: '/events',
        priority: 'high'
      },
      {
        id: '3',
        title: 'Marketplace item suggested',
        description: 'New item matching your interests posted for sale',
        source: 'home',
        type: 'marketplace',
        timestamp: '30 minutes ago',
        actionUrl: '/marketplace',
        priority: 'low'
      },
      {
        id: '4',
        title: 'Safety alert processed',
        description: 'Your safety automation forwarded alert to emergency contacts',
        source: 'community',
        type: 'safety',
        timestamp: '1 hour ago',
        actionUrl: '/safety',
        priority: 'high'
      }
    ];

    setActions(sampleActions);
    
    // Simulate periodic sync
    const syncInterval = setInterval(() => {
      setSyncStatus('syncing');
      setTimeout(() => setSyncStatus('synced'), 2000);
    }, 30000);

    return () => clearInterval(syncInterval);
  }, []);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageSquare className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'marketplace':
        return <ShoppingBag className="h-4 w-4" />;
      case 'safety':
        return <Bell className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-community-yellow';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return { variant: 'destructive' as const, label: 'High' };
      case 'medium':
        return { variant: 'default' as const, label: 'Medium' };
      case 'low':
        return { variant: 'secondary' as const, label: 'Low' };
      default:
        return { variant: 'outline' as const, label: 'Normal' };
    }
  };

  const automationStats = [
    { label: 'Active Automations', value: 6, icon: Zap },
    { label: 'Actions Today', value: 24, icon: TrendingUp },
    { label: 'Cross-Page Syncs', value: 152, icon: Home }
  ];

  return (
    <div className="space-y-6">
      {/* Integration Status */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Home className="h-5 w-5 mr-2 text-primary" />
              Home ↔ Community Integration
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={syncStatus === 'synced' ? 'default' : syncStatus === 'syncing' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {syncStatus === 'synced' && '✓ Synced'}
                {syncStatus === 'syncing' && '⟳ Syncing...'}
                {syncStatus === 'error' && '⚠ Error'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {automationStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                  <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Automation Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-community-yellow" />
            Recent Automation Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actions.map((action) => {
              const priorityBadge = getPriorityBadge(action.priority);
              
              return (
                <div 
                  key={action.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`mt-1 ${getPriorityColor(action.priority)}`}>
                      {getActionIcon(action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{action.title}</h4>
                        <Badge variant={priorityBadge.variant} className="text-xs">
                          {priorityBadge.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{action.description}</p>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <span>{action.timestamp}</span>
                        <Badge variant="outline" className="text-xs">
                          {action.source}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-2">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Automations seamlessly connect your home dashboard with community activities
              </span>
              <Button variant="outline" size="sm">
                View All Actions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Integration Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Integration Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Cross-Page Notifications</h4>
                <p className="text-xs text-muted-foreground">Get home alerts for community activities</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Real-time Sync</h4>
                <p className="text-xs text-muted-foreground">Sync data between home and community dashboards</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Smart Suggestions</h4>
                <p className="text-xs text-muted-foreground">AI-powered content recommendations</p>
              </div>
              <Button variant="outline" size="sm">Setup</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomeIntegration;