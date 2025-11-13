import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BoltIcon as ZapIcon, 
  BellIcon, 
  EnvelopeIcon as MailIcon, 
  DevicePhoneMobileIcon as SmartphoneIcon, 
  GlobeAltIcon as GlobeIcon, 
  ClockIcon,
  Cog6ToothIcon as SettingsIcon,
  PlusIcon,
  BoltIcon as ActivityIcon,
  ExclamationTriangleIcon as AlertTriangleIcon,
  HomeIcon,
  BeakerIcon as TestTubeIcon,
  CalendarIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

interface UserAutomation {
  automation_id: string;
  automation_name: string;
  automation_description: string;
  automation_type: string;
  automation_icon: string;
  is_enabled: boolean;
  webhook_url: string | null;
  custom_settings: any;
}

const HomeAutomations = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [automations, setAutomations] = useState<UserAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Load user automation preferences on component mount
  useEffect(() => {
    if (user) {
      loadUserAutomations();
    }
  }, [user]);

  const loadUserAutomations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_automation_preferences');
      
      if (error) {
        console.error('Error loading automations:', error);
        toast({
          title: "Error",
          description: "Failed to load automation settings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setAutomations(data || []);
    } catch (error) {
      console.error('Error loading automations:', error);
      toast({
        title: "Error",
        description: "Failed to load automation settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (automationId: string): Promise<void> => {
    const automation = automations.find(a => a.automation_id === automationId);
    if (!automation) return;

    const newEnabledState = !automation.is_enabled;
    
    try {
      // Optimistically update UI
      setAutomations(prevAutomations => 
        prevAutomations.map(auto => 
          auto.automation_id === automationId 
            ? { ...auto, is_enabled: newEnabledState }
            : auto
        )
      );

      const { error } = await supabase.rpc('update_user_automation_preference', {
        _automation_id: automationId,
        _is_enabled: newEnabledState,
        _webhook_url: automation.webhook_url,
        _custom_settings: automation.custom_settings
      });

      if (error) {
        throw error;
      }

      toast({
        title: newEnabledState ? "Automation Enabled" : "Automation Disabled",
        description: `${automation.automation_name} has been ${newEnabledState ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      // Revert optimistic update on error
      setAutomations(prevAutomations => 
        prevAutomations.map(auto => 
          auto.automation_id === automationId 
            ? { ...auto, is_enabled: !newEnabledState }
            : auto
        )
      );
      
      console.error('Error updating automation:', error);
      toast({
        title: "Error",
        description: "Failed to update automation setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const testWebhook = async (automationId: string): Promise<void> => {
    const automation = automations.find(a => a.automation_id === automationId);
    
    if (!automation || !automation.webhook_url) {
      toast({
        title: "No Webhook URL",
        description: "Please configure a webhook URL first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestingWebhook(automationId);
      
      const response = await fetch(automation.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          test: true,
          automation: {
            id: automation.automation_id,
            name: automation.automation_name,
            type: automation.automation_type
          },
          timestamp: new Date().toISOString(),
          message: 'This is a test webhook from CommunityConnect automations',
          user_id: user?.id
        }),
      });

      toast({
        title: "Webhook Test Sent",
        description: "Test webhook has been sent successfully. Check your endpoint for the test data.",
      });
    } catch (error) {
      console.error('Webhook test error:', error);
      toast({
        title: "Webhook Test Failed",
        description: "Failed to send test webhook. Please check your URL and try again.",
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  const updateWebhookUrl = async (automationId: string, url: string): Promise<void> => {
    const automation = automations.find(a => a.automation_id === automationId);
    if (!automation) return;

    try {
      // Update local state optimistically
      setAutomations(prevAutomations => 
        prevAutomations.map(auto => 
          auto.automation_id === automationId 
            ? { ...auto, webhook_url: url }
            : auto
        )
      );

      const { error } = await supabase.rpc('update_user_automation_preference', {
        _automation_id: automationId,
        _is_enabled: automation.is_enabled,
        _webhook_url: url || null,
        _custom_settings: automation.custom_settings
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Webhook URL Updated",
        description: "Your webhook URL has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating webhook URL:', error);
      toast({
        title: "Error",
        description: "Failed to update webhook URL. Please try again.",
        variant: "destructive",
      });
      
      // Revert optimistic update
      await loadUserAutomations();
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'webhook': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'push_notification': return 'bg-purple-100 text-purple-800';
      case 'zapier': return 'bg-orange-100 text-orange-800';
      case 'safety_alert': return 'bg-red-100 text-red-800';
      case 'community_digest': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get automation icon
  const getAutomationIcon = (iconName: string, automationType: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'Bell': Bell,
      'Mail': Mail,
      'Zap': Zap,
      'Smartphone': Smartphone,
      'Calendar': Calendar,
      'ShoppingBag': ShoppingBag,
      'AlertTriangle': AlertTriangle,
      'Home': Home,
      'Settings': Settings,
      'Globe': Globe,
      'Clock': Clock
    };
    
    const IconComponent = iconMap[iconName] || Bell;
    return IconComponent;
  };

  if (!user) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Smart Automations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please sign in to manage your automations.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Smart Automations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Smart Automations
          </CardTitle>
          <Badge variant="secondary" className="bg-gradient-primary text-white">
            {automations.filter(a => a.is_enabled).length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {automations.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No automations available</p>
              <p className="text-xs text-muted-foreground">Check back later for new automation options</p>
            </div>
          ) : (
            automations.map((automation) => {
              const IconComponent = getAutomationIcon(automation.automation_icon, automation.automation_type);
              const needsWebhook = ['webhook', 'zapier'].includes(automation.automation_type);
              
              return (
                <div key={automation.automation_id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        <IconComponent className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{automation.automation_name}</h4>
                          <Badge variant="outline" className={`text-xs ${getTypeColor(automation.automation_type)}`}>
                            {automation.automation_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {automation.automation_description}
                        </p>
                        
                        {/* Webhook configuration */}
                        {needsWebhook && automation.is_enabled && (
                          <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-lg">
                            <Label htmlFor={`webhook-${automation.automation_id}`} className="text-xs font-medium">
                              {automation.automation_type === 'zapier' ? 'Zapier Webhook URL' : 'Webhook URL'}
                            </Label>
                            <div className="flex space-x-2">
                              <Input
                                id={`webhook-${automation.automation_id}`}
                                type="url"
                                placeholder={automation.automation_type === 'zapier' ? "https://hooks.zapier.com/hooks/catch/..." : "Enter webhook URL"}
                                value={automation.webhook_url || ''}
                                onChange={(e) => updateWebhookUrl(automation.automation_id, e.target.value)}
                                className="flex-1 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => testWebhook(automation.automation_id)}
                                disabled={!automation.webhook_url || testingWebhook === automation.automation_id}
                              >
                                <TestTube className="h-3 w-3 mr-1" />
                                {testingWebhook === automation.automation_id ? 'Testing...' : 'Test'}
                              </Button>
                            </div>
                            {automation.automation_type === 'zapier' && (
                              <p className="text-xs text-muted-foreground">
                                Create a webhook trigger in Zapier and paste the URL here
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={automation.is_enabled}
                      onCheckedChange={() => toggleAutomation(automation.automation_id)}
                    />
                  </div>
                </div>
              );
            })
          )}
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