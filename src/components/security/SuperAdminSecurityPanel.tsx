import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Lock, Clock, MapPin, AlertTriangle, Activity } from '@/lib/icons';

interface SecuritySettings {
  allowed_ip_addresses: string[];
  require_session_confirmation: boolean;
  max_session_duration_hours: number;
  require_periodic_reauth: boolean;
  reauth_interval_minutes: number;
  is_locked: boolean;
  failed_security_attempts: number;
  last_security_check: string | null;
}

export const SuperAdminSecurityPanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettings>({
    allowed_ip_addresses: [],
    require_session_confirmation: true,
    max_session_duration_hours: 8,
    require_periodic_reauth: true,
    reauth_interval_minutes: 60,
    is_locked: false,
    failed_security_attempts: 0,
    last_security_check: null,
  });
  const [newIpAddress, setNewIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadSecuritySettings();
      checkSecurityStatus();
    }
  }, [user]);

  const loadSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('super_admin_security')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const checkSecurityStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('check_super_admin_security', {
        _user_id: user?.id
      });

      if (data) {
        setSecurityStatus(data);
      }
    } catch (error) {
      console.error('Error checking security status:', error);
    }
  };

  const updateSettings = async (updates: Partial<SecuritySettings>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('super_admin_security')
        .upsert({
          user_id: user?.id,
          ...settings,
          ...updates,
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...updates }));
      toast({
        title: "Security Settings Updated",
        description: "Your security preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        title: "Update Failed",
        description: "Unable to update security settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addIpAddress = () => {
    if (!newIpAddress) return;
    
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newIpAddress)) {
      toast({
        title: "Invalid IP Address",
        description: "Please enter a valid IPv4 address.",
        variant: "destructive",
      });
      return;
    }

    const updatedIps = [...settings.allowed_ip_addresses, newIpAddress];
    updateSettings({ allowed_ip_addresses: updatedIps });
    setNewIpAddress('');
  };

  const removeIpAddress = (ipToRemove: string) => {
    const updatedIps = settings.allowed_ip_addresses.filter(ip => ip !== ipToRemove);
    updateSettings({ allowed_ip_addresses: updatedIps });
  };

  const performSecurityCheck = async () => {
    setIsLoading(true);
    try {
      await supabase.rpc('update_super_admin_security_check', {
        _user_id: user?.id
      });

      toast({
        title: "Security Check Complete",
        description: "Your security status has been updated.",
      });
      
      await checkSecurityStatus();
      await loadSecuritySettings();
    } catch (error) {
      console.error('Error performing security check:', error);
      toast({
        title: "Security Check Failed",
        description: "Unable to complete security check.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>
            Overview of your super admin security status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Account Status</span>
              <Badge variant={settings.is_locked ? "destructive" : "secondary"}>
                {settings.is_locked ? "Locked" : "Active"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Failed Attempts</span>
              <Badge variant={settings.failed_security_attempts > 0 ? "destructive" : "secondary"}>
                {settings.failed_security_attempts}
              </Badge>
            </div>
          </div>
          
          {securityStatus && (
            <div className="space-y-2">
              {securityStatus.last_reauth_expired && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Re-authentication required</span>
                </div>
              )}
              {securityStatus.requires_ip_check && !securityStatus.ip_allowed && (
                <div className="flex items-center gap-2 text-red-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">IP address not in allowed list</span>
                </div>
              )}
            </div>
          )}

          <Button onClick={performSecurityCheck} disabled={isLoading} className="w-full">
            <Activity className="h-4 w-4 mr-2" />
            {isLoading ? "Performing Security Check..." : "Perform Security Check"}
          </Button>
        </CardContent>
      </Card>

      {/* IP Address Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            IP Address Restrictions
          </CardTitle>
          <CardDescription>
            Restrict access to specific IP addresses for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Allowed IP Addresses</Label>
            <div className="flex gap-2">
              <Input
                placeholder="192.168.1.1"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
              />
              <Button onClick={addIpAddress} variant="outline">
                Add
              </Button>
            </div>
          </div>

          {settings.allowed_ip_addresses.length > 0 && (
            <div className="space-y-2">
              <Label>Current Restrictions</Label>
              <div className="space-y-1">
                {settings.allowed_ip_addresses.map((ip, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <code className="text-sm">{ip}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeIpAddress(ip)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Security
          </CardTitle>
          <CardDescription>
            Configure session timeout and re-authentication requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Session Confirmation</Label>
              <p className="text-sm text-muted-foreground">
                Require confirmation for sensitive actions
              </p>
            </div>
            <Switch
              checked={settings.require_session_confirmation}
              onCheckedChange={(checked) => 
                updateSettings({ require_session_confirmation: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Maximum Session Duration (hours)</Label>
            <Input
              type="number"
              min="1"
              max="24"
              value={settings.max_session_duration_hours}
              onChange={(e) => 
                updateSettings({ max_session_duration_hours: parseInt(e.target.value) || 8 })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Periodic Re-authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require periodic identity verification
              </p>
            </div>
            <Switch
              checked={settings.require_periodic_reauth}
              onCheckedChange={(checked) => 
                updateSettings({ require_periodic_reauth: checked })
              }
            />
          </div>

          {settings.require_periodic_reauth && (
            <div className="space-y-2">
              <Label>Re-authentication Interval (minutes)</Label>
              <Input
                type="number"
                min="15"
                max="480"
                value={settings.reauth_interval_minutes}
                onChange={(e) => 
                  updateSettings({ reauth_interval_minutes: parseInt(e.target.value) || 60 })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Information
          </CardTitle>
          <CardDescription>
            Recent security events and checks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Last Security Check:</span>
              <span className="text-muted-foreground">
                {settings.last_security_check 
                  ? new Date(settings.last_security_check).toLocaleString()
                  : "Never"
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Failed Security Attempts:</span>
              <span className="text-muted-foreground">
                {settings.failed_security_attempts}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};