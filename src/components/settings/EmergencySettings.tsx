import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Users, MapPin, AlertTriangle } from '@/lib/icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyPreferences {
  auto_alert_contacts: boolean;
  auto_alert_public: boolean;
  share_location_with_contacts: boolean;
  share_location_with_public: boolean;
}

const EmergencySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<EmergencyPreferences>({
    auto_alert_contacts: true,
    auto_alert_public: true,
    share_location_with_contacts: true,
    share_location_with_public: false,
  });

  const [loading, setLoading] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('emergency_preferences')
        .select('auto_alert_contacts, auto_alert_public, share_location_with_contacts, share_location_with_public')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setPreferences({
          auto_alert_contacts: data.auto_alert_contacts,
          auto_alert_public: data.auto_alert_public,
          share_location_with_contacts: data.share_location_with_contacts,
          share_location_with_public: data.share_location_with_public,
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load emergency preferences.', variant: 'destructive' });
    }
  }, [user, toast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async (newPreferences: Partial<EmergencyPreferences>) => {
    if (!user) return;

    setLoading(true);
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      const { error } = await supabase
        .from('emergency_preferences')
        .upsert({
          user_id: user.id,
          ...updatedPreferences
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      toast({
        title: "Settings saved",
        description: "Your emergency preferences have been updated.",
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save emergency preferences.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof EmergencyPreferences, value: boolean) => {
    savePreferences({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Contact Alerting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Emergency Contact Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-alert-contacts">Automatically alert emergency contacts</Label>
              <p className="text-sm text-muted-foreground">
                Send alerts to your emergency contacts when you trigger a panic alert
              </p>
            </div>
            <Switch
              id="auto-alert-contacts"
              checked={preferences.auto_alert_contacts}
              onCheckedChange={(checked) => handlePreferenceChange('auto_alert_contacts', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="share-location-contacts">Share location with contacts</Label>
              <p className="text-sm text-muted-foreground">
                Include your real-time location when alerting emergency contacts
              </p>
            </div>
            <Switch
              id="share-location-contacts"
              checked={preferences.share_location_with_contacts}
              onCheckedChange={(checked) => handlePreferenceChange('share_location_with_contacts', checked)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Public Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Public Emergency Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-alert-public">Alert the public of emergencies in your area</Label>
              <p className="text-sm text-muted-foreground">
                Notify nearby community members when you have an emergency
              </p>
            </div>
            <Switch
              id="auto-alert-public"
              checked={preferences.auto_alert_public}
              onCheckedChange={(checked) => handlePreferenceChange('auto_alert_public', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="share-location-public">Share general location with public</Label>
              <p className="text-sm text-muted-foreground">
                Show approximate area (not exact address) to help community respond
              </p>
            </div>
            <Switch
              id="share-location-public"
              checked={preferences.share_location_with_public}
              onCheckedChange={(checked) => handlePreferenceChange('share_location_with_public', checked)}
              disabled={loading}
            />
          </div>

          {preferences.auto_alert_public && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Privacy Notice</p>
                  <p>When public alerts are enabled, nearby community members will see that there is an active emergency in your area. Your exact location and identity will only be shared with emergency contacts and authorities.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencySettings;