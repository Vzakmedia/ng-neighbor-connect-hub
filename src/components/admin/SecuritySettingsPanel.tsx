import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Save, RefreshCw, AlertTriangle } from '@/lib/icons';
import { Textarea } from '@/components/ui/textarea';

interface SecuritySettings {
  password_min_length: number;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  require_email_verification: boolean;
  allowed_signup_domains: string[];
}

export default function SecuritySettingsPanel() {
  const [settings, setSettings] = useState<SecuritySettings>({
    password_min_length: 8,
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    require_email_verification: true,
    allowed_signup_domains: [],
  });
  const [domainsText, setDomainsText] = useState('');
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
        prefix_param: 'security.'
      });

      if (error) throw error;

      if (data) {
        const newSettings = { ...settings };
        data.forEach((config: any) => {
          const key = config.config_key.replace('security.', '');
          if (key === 'allowed_signup_domains') {
            newSettings[key] = config.config_value || [];
            setDomainsText((config.config_value || []).join('\n'));
          } else if (key === 'require_email_verification') {
            newSettings[key] = config.config_value === true || config.config_value === 'true';
          } else {
            newSettings[key] = typeof config.config_value === 'number' 
              ? config.config_value 
              : parseInt(config.config_value);
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load security settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Parse domains from textarea
      const domains = domainsText
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const configs = [
        {
          config_key: 'security.password_min_length',
          config_type: 'app_settings',
          config_value: settings.password_min_length.toString(),
          description: 'Minimum password length requirement',
        },
        {
          config_key: 'security.session_timeout_minutes',
          config_type: 'app_settings',
          config_value: settings.session_timeout_minutes.toString(),
          description: 'Session timeout in minutes',
        },
        {
          config_key: 'security.max_login_attempts',
          config_type: 'app_settings',
          config_value: settings.max_login_attempts.toString(),
          description: 'Maximum failed login attempts before lockout',
        },
        {
          config_key: 'security.lockout_duration_minutes',
          config_type: 'app_settings',
          config_value: settings.lockout_duration_minutes.toString(),
          description: 'Account lockout duration in minutes',
        },
        {
          config_key: 'security.require_email_verification',
          config_type: 'app_settings',
          config_value: settings.require_email_verification.toString(),
          description: 'Require email verification for new accounts',
        },
        {
          config_key: 'security.allowed_signup_domains',
          config_type: 'app_settings',
          config_value: JSON.stringify(domains),
          description: 'List of allowed email domains for signup',
        },
      ];

      const { data, error } = await supabase.rpc('batch_update_configs', {
        configs: configs
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Security settings saved successfully',
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save security settings',
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

  const updateSetting = (key: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
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
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Configure authentication and account security policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Policy */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold">Password Policy</h3>
          </div>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="password_min_length">
                Minimum Password Length
              </Label>
              <Input
                id="password_min_length"
                type="number"
                min="6"
                max="32"
                value={settings.password_min_length}
                onChange={(e) => updateSetting('password_min_length', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum number of characters required for passwords (6-32)
              </p>
            </div>
          </div>
        </div>

        {/* Session Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold">Session Management</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="session_timeout">
              Session Timeout (minutes)
            </Label>
            <Input
              id="session_timeout"
              type="number"
              min="15"
              max="1440"
              value={settings.session_timeout_minutes}
              onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Inactive users will be logged out after this period (15-1440 minutes)
            </p>
          </div>
        </div>

        {/* Account Lockout */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold">Account Lockout</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max_login_attempts">
                Max Login Attempts
              </Label>
              <Input
                id="max_login_attempts"
                type="number"
                min="3"
                max="10"
                value={settings.max_login_attempts}
                onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Failed attempts before lockout (3-10)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockout_duration">
                Lockout Duration (minutes)
              </Label>
              <Input
                id="lockout_duration"
                type="number"
                min="5"
                max="1440"
                value={settings.lockout_duration_minutes}
                onChange={(e) => updateSetting('lockout_duration_minutes', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                How long accounts stay locked (5-1440 minutes)
              </p>
            </div>
          </div>
        </div>

        {/* Email Verification */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold">Email Verification</h3>
          </div>
          
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Require Email Verification</Label>
              <p className="text-xs text-muted-foreground">
                New users must verify their email before accessing the platform
              </p>
            </div>
            <Switch
              checked={settings.require_email_verification}
              onCheckedChange={(checked) => updateSetting('require_email_verification', checked)}
            />
          </div>
        </div>

        {/* Domain Restrictions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold">Signup Domain Restrictions</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="allowed_domains">
              Allowed Email Domains
            </Label>
            <Textarea
              id="allowed_domains"
              placeholder="example.com&#10;company.org&#10;(one domain per line, leave empty to allow all)"
              rows={4}
              value={domainsText}
              onChange={(e) => {
                setDomainsText(e.target.value);
                setHasChanges(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Only users with emails from these domains can sign up. Leave empty to allow all domains.
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
