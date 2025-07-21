import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Bell, 
  Mail, 
  Smartphone, 
  Globe, 
  Clock,
  Settings,
  Plus,
  Activity
} from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  type: 'notification' | 'integration' | 'scheduling' | 'webhook';
  webhookUrl?: string;
}

const HomeAutomations = () => {
  const { toast } = useToast();
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      name: 'Safety Alert Notifications',
      description: 'Get instant notifications for safety alerts in your area',
      icon: Bell,
      enabled: true,
      type: 'notification'
    },
    {
      id: '2',
      name: 'Email Digest',
      description: 'Daily community updates sent to your email',
      icon: Mail,
      enabled: false,
      type: 'notification'
    },
    {
      id: '3',
      name: 'Zapier Integration',
      description: 'Connect community events to your favorite apps',
      icon: Zap,
      enabled: false,
      type: 'webhook',
      webhookUrl: ''
    },
    {
      id: '4',
      name: 'Mobile Push Alerts',
      description: 'Receive push notifications for important community updates',
      icon: Smartphone,
      enabled: true,
      type: 'notification'
    },
    {
      id: '5',
      name: 'Event Reminders',
      description: 'Automatic reminders 1 hour before events you\'re attending',
      icon: Clock,
      enabled: true,
      type: 'scheduling'
    },
    {
      id: '6',
      name: 'Marketplace Alerts',
      description: 'Get notified when items matching your interests are posted',
      icon: Globe,
      enabled: false,
      type: 'notification'
    }
  ]);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const toggleAutomation = (id: string) => {
    setAutomations(prev => 
      prev.map(automation => 
        automation.id === id 
          ? { ...automation, enabled: !automation.enabled }
          : automation
      )
    );

    const automation = automations.find(a => a.id === id);
    toast({
      title: automation?.enabled ? "Automation Disabled" : "Automation Enabled",
      description: `${automation?.name} has been ${automation?.enabled ? 'disabled' : 'enabled'}.`,
    });
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebhook(true);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          type: "test",
          message: "Test automation from NeighborConnect",
          timestamp: new Date().toISOString(),
          source: "home_automations"
        }),
      });

      toast({
        title: "Webhook Test Sent",
        description: "Check your connected service to see if the webhook was received.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send webhook test. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const updateWebhookUrl = (automationId: string, url: string) => {
    setAutomations(prev =>
      prev.map(automation =>
        automation.id === automationId
          ? { ...automation, webhookUrl: url }
          : automation
      )
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'notification': return 'bg-community-blue/20 text-community-blue';
      case 'integration': return 'bg-community-green/20 text-community-green';
      case 'scheduling': return 'bg-community-yellow/20 text-community-yellow';
      case 'webhook': return 'bg-primary/20 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Smart Automations
          </CardTitle>
          <Badge variant="secondary" className="bg-gradient-primary text-white">
            {automations.filter(a => a.enabled).length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {automations.map((automation) => {
            const Icon = automation.icon;
            return (
              <div key={automation.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{automation.name}</h4>
                        <Badge variant="outline" className={`text-xs ${getTypeColor(automation.type)}`}>
                          {automation.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {automation.description}
                      </p>
                      
                      {automation.type === 'webhook' && automation.enabled && (
                        <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-lg">
                          <Label htmlFor={`webhook-${automation.id}`} className="text-xs font-medium">
                            Webhook URL (e.g., Zapier webhook)
                          </Label>
                          <div className="flex space-x-2">
                            <Input
                              id={`webhook-${automation.id}`}
                              type="url"
                              placeholder="https://hooks.zapier.com/hooks/catch/..."
                              value={automation.webhookUrl || webhookUrl}
                              onChange={(e) => {
                                setWebhookUrl(e.target.value);
                                updateWebhookUrl(automation.id, e.target.value);
                              }}
                              className="flex-1 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={testWebhook}
                              disabled={isTestingWebhook || !automation.webhookUrl}
                            >
                              {isTestingWebhook ? "Testing..." : "Test"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={automation.enabled}
                    onCheckedChange={() => toggleAutomation(automation.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t">
          <Button variant="outline" className="w-full" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Automation
            <Badge variant="secondary" className="ml-2 text-xs">
              Coming Soon
            </Badge>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HomeAutomations;