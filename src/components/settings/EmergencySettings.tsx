import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Shield, Timer, Users, MapPin, MessageCircle, Phone, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SituationType = 'medical_emergency' | 'fire' | 'break_in' | 'assault' | 'accident' | 'natural_disaster' | 'suspicious_activity' | 'domestic_violence' | 'other';

interface EmergencyPreferences {
  auto_alert_contacts: boolean;
  auto_alert_public: boolean;
  share_location_with_contacts: boolean;
  share_location_with_public: boolean;
  default_situation_type: SituationType;
  countdown_duration: number;
}

const EmergencySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<EmergencyPreferences>({
    auto_alert_contacts: true,
    auto_alert_public: true,
    share_location_with_contacts: true,
    share_location_with_public: false,
    default_situation_type: 'other' as SituationType,
    countdown_duration: 3
  });

  const [loading, setLoading] = useState(false);

  const situationTypes = [
    { value: 'medical_emergency', label: 'Medical Emergency', icon: '🏥' },
    { value: 'fire', label: 'Fire', icon: '🔥' },
    { value: 'break_in', label: 'Break In', icon: '🔓' },
    { value: 'assault', label: 'Assault', icon: '⚠️' },
    { value: 'accident', label: 'Accident', icon: '🚗' },
    { value: 'natural_disaster', label: 'Natural Disaster', icon: '🌪️' },
    { value: 'suspicious_activity', label: 'Suspicious Activity', icon: '👁️' },
    { value: 'domestic_violence', label: 'Domestic Violence', icon: '🏠' },
    { value: 'other', label: 'Other', icon: '❓' }
  ];

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          auto_alert_contacts: data.auto_alert_contacts,
          auto_alert_public: data.auto_alert_public,
          share_location_with_contacts: data.share_location_with_contacts,
          share_location_with_public: data.share_location_with_public,
          default_situation_type: data.default_situation_type as SituationType,
          countdown_duration: data.countdown_duration
        });
      }
    } catch (error) {
      console.error('Error loading emergency preferences:', error);
    }
  };

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
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      toast({
        title: "Settings saved",
        description: "Your emergency preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving emergency preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save emergency preferences.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof EmergencyPreferences, value: boolean | string | number) => {
    savePreferences({ [key]: value as any });
  };

  return (
    <div className="space-y-6">
      {/* Default Emergency Situation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Default Emergency Situation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="situation-type">What type of emergency will be pre-selected?</Label>
            <Select
              value={preferences.default_situation_type}
              onValueChange={(value) => handlePreferenceChange('default_situation_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {situationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            This situation type will be pre-selected when you press the panic button, but you can change it before sending the alert.
          </p>
        </CardContent>
      </Card>

      {/* Timing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Timing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="countdown-duration">Countdown Duration (seconds)</Label>
            <Select
              value={preferences.countdown_duration.toString()}
              onValueChange={(value) => handlePreferenceChange('countdown_duration', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 seconds</SelectItem>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="0">No countdown (instant)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            How long to wait before automatically sending the emergency alert after pressing the panic button.
          </p>
        </CardContent>
      </Card>

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