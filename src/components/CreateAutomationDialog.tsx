import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Clock, 
  Zap, 
  Bell, 
  Mail, 
  Database, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Check,
  Settings,
  Calendar,
  MessageSquare,
  Plus
} from 'lucide-react';

interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAutomationCreated?: () => void;
}

interface AutomationConfig {
  // Basic Info
  name: string;
  description: string;
  category: string;
  
  // Trigger Configuration
  triggerType: 'event' | 'schedule' | 'manual';
  eventTrigger: string;
  schedulePattern: string;
  conditions: {
    enabled: boolean;
    rules: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
  };
  
  // Actions
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  
  // Settings
  enabled: boolean;
  retryOnFailure: boolean;
  maxRetries: number;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  webhookUrl: string;
}

const CreateAutomationDialog = ({ 
  open, 
  onOpenChange, 
  onAutomationCreated 
}: CreateAutomationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState<AutomationConfig>({
    name: '',
    description: '',
    category: 'general',
    triggerType: 'event',
    eventTrigger: '',
    schedulePattern: '0 9 * * 1', // Every Monday at 9 AM
    conditions: {
      enabled: false,
      rules: []
    },
    actions: [],
    enabled: true,
    retryOnFailure: true,
    maxRetries: 3,
    notifyOnSuccess: false,
    notifyOnFailure: true,
    webhookUrl: ''
  });

  const steps = [
    { id: 'basic', title: 'Basic Info', icon: Settings },
    { id: 'trigger', title: 'Trigger', icon: Zap },
    { id: 'conditions', title: 'Conditions', icon: Shield },
    { id: 'actions', title: 'Actions', icon: Play },
    { id: 'settings', title: 'Settings', icon: Bell },
    { id: 'review', title: 'Review', icon: Check }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateAutomation = async () => {
    setLoading(true);
    try {
      // Simulate API call to create automation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Automation Created",
        description: `"${config.name}" has been created successfully`,
      });
      
      onOpenChange(false);
      onAutomationCreated?.();
      
      // Reset form
      setCurrentStep(0);
      setConfig({
        name: '',
        description: '',
        category: 'general',
        triggerType: 'event',
        eventTrigger: '',
        schedulePattern: '0 9 * * 1',
        conditions: { enabled: false, rules: [] },
        actions: [],
        enabled: true,
        retryOnFailure: true,
        maxRetries: 3,
        notifyOnSuccess: false,
        notifyOnFailure: true,
        webhookUrl: ''
      });
    } catch (error) {
      console.error('Error creating automation:', error);
      toast({
        title: "Error",
        description: "Failed to create automation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAction = (actionType: string) => {
    const newAction = {
      type: actionType,
      config: getDefaultActionConfig(actionType)
    };
    setConfig(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const removeAction = (index: number) => {
    setConfig(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const addCondition = (conditionType: string) => {
    const newRule = {
      field: conditionType,
      operator: 'equals',
      value: ''
    };
    setConfig(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        rules: [...prev.conditions.rules, newRule]
      }
    }));
  };

  const removeCondition = (index: number) => {
    setConfig(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        rules: prev.conditions.rules.filter((_, i) => i !== index)
      }
    }));
  };

  const updateCondition = (index: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        rules: prev.conditions.rules.map((rule, i) => 
          i === index ? { ...rule, [field]: value } : rule
        )
      }
    }));
  };

  const getDefaultActionConfig = (actionType: string) => {
    switch (actionType) {
      case 'send_email':
        return { to: '', subject: '', body: '' };
      case 'send_notification':
        return { title: '', message: '', recipients: 'all' };
      case 'update_database':
        return { table: '', operation: 'update', data: {} };
      case 'webhook':
        return { url: '', method: 'POST', headers: {}, body: {} };
      case 'send_sms':
        return { to: '', message: '' };
      case 'create_task':
        return { title: '', description: '', assignee: '', priority: 'medium' };
      case 'backup_data':
        return { tables: [], format: 'json', compress: true };
      case 'generate_report':
        return { type: 'analytics', format: 'pdf', recipients: [] };
      default:
        return {};
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Automation Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter automation name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={config.description}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this automation does"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={config.category} onValueChange={(value) => setConfig(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="safety">Safety & Emergency</SelectItem>
                  <SelectItem value="moderation">Content Moderation</SelectItem>
                  <SelectItem value="analytics">Analytics & Reporting</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="maintenance">System Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'trigger':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Trigger Type</Label>
              <Tabs value={config.triggerType} onValueChange={(value: any) => setConfig(prev => ({ ...prev, triggerType: value }))}>
                <TabsList className="flex mb-4">
                  <TabsTrigger value="event" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Event-based
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Scheduled
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Manual
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="event" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Event Trigger</CardTitle>
                      <CardDescription>Choose what event will trigger this automation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={config.eventTrigger} onValueChange={(value) => setConfig(prev => ({ ...prev, eventTrigger: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_emergency_alert">New Emergency Alert Created</SelectItem>
                          <SelectItem value="new_user_registration">New User Registration</SelectItem>
                          <SelectItem value="content_flagged">Content Flagged for Review</SelectItem>
                          <SelectItem value="promotion_started">Promotion Campaign Started</SelectItem>
                          <SelectItem value="promotion_ended">Promotion Campaign Ended</SelectItem>
                          <SelectItem value="marketplace_item_sold">Marketplace Item Sold</SelectItem>
                          <SelectItem value="service_booked">Service Booked</SelectItem>
                          <SelectItem value="new_post_created">New Community Post Created</SelectItem>
                          <SelectItem value="user_banned">User Banned/Suspended</SelectItem>
                          <SelectItem value="payment_received">Payment Received</SelectItem>
                          <SelectItem value="high_activity_threshold">High Activity Threshold Reached</SelectItem>
                          <SelectItem value="system_error">System Error Detected</SelectItem>
                          <SelectItem value="user_inactive">User Inactive for X Days</SelectItem>
                          <SelectItem value="storage_threshold">Storage Threshold Reached</SelectItem>
                          <SelectItem value="security_incident">Security Incident Detected</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="schedule" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Schedule Configuration</CardTitle>
                      <CardDescription>Set when this automation should run</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Cron Pattern</Label>
                        <Input
                          value={config.schedulePattern}
                          onChange={(e) => setConfig(prev => ({ ...prev, schedulePattern: e.target.value }))}
                          placeholder="0 9 * * 1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Current: Every Monday at 9:00 AM
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => setConfig(prev => ({ ...prev, schedulePattern: '0 * * * *' }))}>
                          Hourly
                        </Button>
                        <Button variant="outline" onClick={() => setConfig(prev => ({ ...prev, schedulePattern: '0 9 * * *' }))}>
                          Daily at 9 AM
                        </Button>
                        <Button variant="outline" onClick={() => setConfig(prev => ({ ...prev, schedulePattern: '0 9 * * 1' }))}>
                          Weekly (Mon)
                        </Button>
                        <Button variant="outline" onClick={() => setConfig(prev => ({ ...prev, schedulePattern: '0 9 1 * *' }))}>
                          Monthly
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Manual Trigger</CardTitle>
                      <CardDescription>This automation will only run when manually triggered</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Manual automations can be triggered from the admin dashboard or via API calls.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        );

      case 'conditions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Conditions</h3>
                <p className="text-sm text-muted-foreground">Add conditions to control when this automation runs</p>
              </div>
              <Switch
                checked={config.conditions.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  conditions: { ...prev.conditions, enabled: checked }
                }))}
              />
            </div>
            
            {config.conditions.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Condition Rules</CardTitle>
                  <CardDescription>All conditions must be true for the automation to run</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Button variant="outline" onClick={() => addCondition('user_role')}>
                        <Shield className="h-4 w-4 mr-2" />
                        User Role
                      </Button>
                      <Button variant="outline" onClick={() => addCondition('time_range')}>
                        <Clock className="h-4 w-4 mr-2" />
                        Time Range
                      </Button>
                      <Button variant="outline" onClick={() => addCondition('location')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Location
                      </Button>
                      <Button variant="outline" onClick={() => addCondition('custom_field')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Custom Field
                      </Button>
                    </div>
                    
                    {config.conditions.rules.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No conditions added yet. Click above to add conditions.
                      </div>
                    )}
                    
                    {config.conditions.rules.map((rule, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Condition {index + 1}</h4>
                          <Button variant="ghost" size="sm" onClick={() => removeCondition(index)}>
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={rule.field} onValueChange={(value) => updateCondition(index, 'field', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user_role">User Role</SelectItem>
                              <SelectItem value="time">Time</SelectItem>
                              <SelectItem value="location">Location</SelectItem>
                              <SelectItem value="status">Status</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={rule.operator} onValueChange={(value) => updateCondition(index, 'operator', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Operator" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="not_equals">Not Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="greater_than">Greater Than</SelectItem>
                              <SelectItem value="less_than">Less Than</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input 
                            value={rule.value} 
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            placeholder="Value" 
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'actions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Actions</h3>
                <p className="text-sm text-muted-foreground">Define what happens when this automation runs</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => addAction('send_email')}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" onClick={() => addAction('send_notification')}>
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
              <Button variant="outline" onClick={() => addAction('update_database')}>
                <Database className="h-4 w-4 mr-2" />
                Update Database
              </Button>
              <Button variant="outline" onClick={() => addAction('webhook')}>
                <Zap className="h-4 w-4 mr-2" />
                Call Webhook
              </Button>
              <Button variant="outline" onClick={() => addAction('send_sms')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send SMS
              </Button>
              <Button variant="outline" onClick={() => addAction('create_task')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
              <Button variant="outline" onClick={() => addAction('backup_data')}>
                <Database className="h-4 w-4 mr-2" />
                Backup Data
              </Button>
              <Button variant="outline" onClick={() => addAction('generate_report')}>
                <Calendar className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
            
            <div className="space-y-4">
              {config.actions.map((action, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {action.type === 'send_email' && <Mail className="h-4 w-4" />}
                      {action.type === 'send_notification' && <Bell className="h-4 w-4" />}
                      {action.type === 'update_database' && <Database className="h-4 w-4" />}
                      {action.type === 'webhook' && <Zap className="h-4 w-4" />}
                      {action.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeAction(index)}
                    >
                      Remove
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {action.type === 'send_email' && (
                      <div className="space-y-2">
                        <Input placeholder="Recipient email" />
                        <Input placeholder="Subject" />
                        <Textarea placeholder="Email body" rows={2} />
                      </div>
                    )}
                    {action.type === 'send_notification' && (
                      <div className="space-y-2">
                        <Input placeholder="Notification title" />
                        <Textarea placeholder="Message" rows={2} />
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Recipients" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="admins">Admins Only</SelectItem>
                            <SelectItem value="affected">Affected Users</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {action.type === 'webhook' && (
                      <div className="space-y-2">
                        <Input placeholder="Webhook URL" />
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="HTTP Method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {config.actions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No actions added yet. Add at least one action to continue.
                </div>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>Configure how this automation behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable automation</Label>
                    <p className="text-sm text-muted-foreground">Start this automation immediately after creation</p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Retry on failure</Label>
                    <p className="text-sm text-muted-foreground">Automatically retry failed executions</p>
                  </div>
                  <Switch
                    checked={config.retryOnFailure}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, retryOnFailure: checked }))}
                  />
                </div>
                
                {config.retryOnFailure && (
                  <div className="space-y-2">
                    <Label>Maximum retries</Label>
                    <Select value={config.maxRetries.toString()} onValueChange={(value) => setConfig(prev => ({ ...prev, maxRetries: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 retry</SelectItem>
                        <SelectItem value="3">3 retries</SelectItem>
                        <SelectItem value="5">5 retries</SelectItem>
                        <SelectItem value="10">10 retries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notify on success</Label>
                    <p className="text-sm text-muted-foreground">Send notification when automation succeeds</p>
                  </div>
                  <Switch
                    checked={config.notifyOnSuccess}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, notifyOnSuccess: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notify on failure</Label>
                    <p className="text-sm text-muted-foreground">Send notification when automation fails</p>
                  </div>
                  <Switch
                    checked={config.notifyOnFailure}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, notifyOnFailure: checked }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Webhook URL (Optional)</Label>
                  <Input
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-webhook-url.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Receive automation status updates via webhook
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Automation</CardTitle>
                <CardDescription>Review your automation configuration before creating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm text-muted-foreground">{config.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-muted-foreground">{config.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Trigger Type</Label>
                    <p className="text-sm text-muted-foreground">{config.triggerType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Actions</Label>
                    <p className="text-sm text-muted-foreground">{config.actions.length} action(s)</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{config.description || 'Not specified'}</p>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant={config.enabled ? 'default' : 'secondary'}>
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {config.retryOnFailure && (
                    <Badge variant="outline">Retry on failure</Badge>
                  )}
                  {config.notifyOnFailure && (
                    <Badge variant="outline">Notify on failure</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'basic':
        return config.name.trim() !== '';
      case 'trigger':
        return config.triggerType === 'manual' || 
               (config.triggerType === 'event' && config.eventTrigger) ||
               (config.triggerType === 'schedule' && config.schedulePattern);
      case 'actions':
        return config.actions.length > 0;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Create New Automation
          </DialogTitle>
        </DialogHeader>

        {/* Step Navigation */}
        <div className="flex items-center justify-between border-b pb-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isCompleted ? 'bg-primary text-primary-foreground' :
                  isActive ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-px w-8 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="py-6">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button onClick={handleCreateAutomation} disabled={loading || !canProceed()}>
                {loading ? "Creating..." : "Create Automation"}
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAutomationDialog;