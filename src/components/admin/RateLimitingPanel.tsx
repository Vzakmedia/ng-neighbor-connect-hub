import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Save, RefreshCw, AlertTriangle } from '@/lib/icons';

interface RateLimitSettings {
  panic_button_cooldown_seconds: number;
  max_panics_per_hour: number;
  api_rate_limit_per_minute: number;
  post_rate_limit_per_hour: number;
  message_rate_limit_per_minute: number;
  comment_rate_limit_per_hour: number;
}

export default function RateLimitingPanel() {
  const [settings, setSettings] = useState<RateLimitSettings>({
    panic_button_cooldown_seconds: 60,
    max_panics_per_hour: 3,
    api_rate_limit_per_minute: 60,
    post_rate_limit_per_hour: 10,
    message_rate_limit_per_minute: 20,
    comment_rate_limit_per_hour: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_config_by_prefix', {
        prefix_param: 'rate_limit.'
      });

      if (error) throw error;

      if (data) {
        const newSettings = { ...settings };
        data.forEach((config: any) => {
          const key = config.config_key.replace('rate_limit.', '');
          newSettings[key] = typeof config.config_value === 'number' 
            ? config.config_value 
            : parseInt(config.config_value);
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading rate limiting settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rate limiting settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const configs = [
        {
          config_key: 'rate_limit.panic_button_cooldown_seconds',
          config_type: 'app_settings',
          config_value: settings.panic_button_cooldown_seconds.toString(),
          description: 'Cooldown period between panic button activations',
        },
        {
          config_key: 'rate_limit.max_panics_per_hour',
          config_type: 'app_settings',
          config_value: settings.max_panics_per_hour.toString(),
          description: 'Maximum panic button activations per hour',
        },
        {
          config_key: 'rate_limit.api_rate_limit_per_minute',
          config_type: 'app_settings',
          config_value: settings.api_rate_limit_per_minute.toString(),
          description: 'API requests allowed per minute per user',
        },
        {
          config_key: 'rate_limit.post_rate_limit_per_hour',
          config_type: 'app_settings',
          config_value: settings.post_rate_limit_per_hour.toString(),
          description: 'Maximum posts per hour per user',
        },
        {
          config_key: 'rate_limit.message_rate_limit_per_minute',
          config_type: 'app_settings',
          config_value: settings.message_rate_limit_per_minute.toString(),
          description: 'Maximum messages per minute per user',
        },
        {
          config_key: 'rate_limit.comment_rate_limit_per_hour',
          config_type: 'app_settings',
          config_value: settings.comment_rate_limit_per_hour.toString(),
          description: 'Maximum comments per hour per user',
        },
      ];

      const { data, error } = await supabase.rpc('batch_update_configs', {
        configs: configs
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Rate limiting settings saved successfully',
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving rate limiting settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rate limiting settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    setHasChanges(false);
  };

  const updateSetting = (key: keyof RateLimitSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rate Limiting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Rate Limiting
        </CardTitle>
        <CardDescription>
          Configure rate limits to prevent abuse and ensure fair usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Panic Button Limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold">Panic Button Limits</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="panic_cooldown">
                Cooldown Period (seconds)
              </Label>
              <Input
                id="panic_cooldown"
                type="number"
                min="30"
                max="300"
                value={settings.panic_button_cooldown_seconds}
                onChange={(e) => updateSetting('panic_button_cooldown_seconds', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum time between panic activations (30-300 seconds)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_panics">
                Max Activations Per Hour
              </Label>
              <Input
                id="max_panics"
                type="number"
                min="1"
                max="10"
                value={settings.max_panics_per_hour}
                onChange={(e) => updateSetting('max_panics_per_hour', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum panic alerts per hour per user (1-10)
              </p>
            </div>
          </div>
        </div>

        {/* API Rate Limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold">API Rate Limits</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api_limit">
              API Requests Per Minute
            </Label>
            <Input
              id="api_limit"
              type="number"
              min="10"
              max="1000"
              value={settings.api_rate_limit_per_minute}
              onChange={(e) => updateSetting('api_rate_limit_per_minute', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Maximum API requests per minute per user (10-1000)
            </p>
          </div>
        </div>

        {/* Content Rate Limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold">Content Creation Limits</h3>
          </div>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="post_limit">
                Posts Per Hour
              </Label>
              <Input
                id="post_limit"
                type="number"
                min="1"
                max="100"
                value={settings.post_rate_limit_per_hour}
                onChange={(e) => updateSetting('post_rate_limit_per_hour', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum posts per hour per user (1-100)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment_limit">
                Comments Per Hour
              </Label>
              <Input
                id="comment_limit"
                type="number"
                min="1"
                max="200"
                value={settings.comment_rate_limit_per_hour}
                onChange={(e) => updateSetting('comment_rate_limit_per_hour', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum comments per hour per user (1-200)
              </p>
            </div>
          </div>
        </div>

        {/* Messaging Rate Limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold">Messaging Limits</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message_limit">
              Messages Per Minute
            </Label>
            <Input
              id="message_limit"
              type="number"
              min="1"
              max="100"
              value={settings.message_rate_limit_per_minute}
              onChange={(e) => updateSetting('message_rate_limit_per_minute', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Maximum messages per minute per user (1-100)
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        {hasChanges && (
          <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning/10 p-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Unsaved Changes</p>
              <p className="text-muted-foreground">
                You have unsaved changes. Click Save to apply them.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
