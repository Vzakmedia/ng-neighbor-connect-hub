import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Activity, 
  Bell, 
  Clock,
  Save,
  AlertTriangle
} from 'lucide-react';

interface ConfigureAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: any;
  onAutomationUpdated?: () => void;
}

const ConfigureAutomationDialog = ({ 
  open, 
  onOpenChange, 
  automation,
  onAutomationUpdated 
}: ConfigureAutomationDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    enabled: automation?.status === 'active' ? true : false,
    retryOnFailure: automation?.retry_on_failure ?? true,
    maxRetries: automation?.max_retries ?? 3,
    timeout: automation?.timeout ?? 30,
    notifyOnSuccess: automation?.notify_on_success ?? false,
    notifyOnFailure: automation?.notify_on_failure ?? true,
    webhookUrl: automation?.webhook_url ?? '',
    priority: automation?.priority ?? 'medium'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call to update automation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuration Updated",
        description: `Settings for "${automation?.name}" have been saved`,
      });
      
      onOpenChange(false);
      onAutomationUpdated?.();
    } catch (error) {
      console.error('Error updating automation:', error);
      toast({
        title: "Error",
        description: "Failed to update automation configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!automation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Automation: {automation.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Basic Configuration
                  <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                    {automation.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Core settings for this automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Automation</Label>
                    <p className="text-sm text-muted-foreground">
                      Turn this automation on or off
                    </p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <select 
                    id="priority"
                    value={config.priority}
                    onChange={(e) => setConfig(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={config.timeout}
                    onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                    min="1"
                    max="300"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum time to wait for automation completion
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Handling</CardTitle>
                <CardDescription>
                  Configure how errors should be handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Retry on Failure</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically retry failed executions
                    </p>
                  </div>
                  <Switch
                    checked={config.retryOnFailure}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, retryOnFailure: checked }))}
                  />
                </div>

                {config.retryOnFailure && (
                  <div className="space-y-2">
                    <Label htmlFor="maxRetries">Maximum Retries</Label>
                    <Input
                      id="maxRetries"
                      type="number"
                      value={config.maxRetries}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                      min="1"
                      max="10"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Executions</Label>
                    <div className="text-2xl font-bold">{automation.execution_count || 0}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Success Rate</Label>
                    <div className="text-2xl font-bold text-green-600">
                      {automation.success_rate || '100%'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Average Duration</Label>
                    <div className="text-2xl font-bold">{automation.avg_duration || '2.3s'}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Execution</Label>
                    <div className="text-sm">
                      {automation.last_run ? new Date(automation.last_run).toLocaleString() : 'Never'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure when and how to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notify on Success</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when automation completes successfully
                    </p>
                  </div>
                  <Switch
                    checked={config.notifyOnSuccess}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, notifyOnSuccess: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notify on Failure</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when automation fails
                    </p>
                  </div>
                  <Switch
                    checked={config.notifyOnFailure}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, notifyOnFailure: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                  <Input
                    id="webhookUrl"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-webhook-url.com/automation"
                  />
                  <p className="text-xs text-muted-foreground">
                    Send automation results to an external webhook
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigureAutomationDialog;