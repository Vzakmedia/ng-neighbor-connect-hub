import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock, 
  Shield,
  Zap,
  CheckCircle,
  X,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMinimalAuth as useAuth } from '@/hooks/useAuth-minimal';
import { toast } from '@/hooks/use-toast';

const PanicButton = () => {
  const { user } = useAuth();
  const [isPressed, setIsPressed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [selectedSituation, setSelectedSituation] = useState<'medical_emergency' | 'fire' | 'break_in' | 'assault' | 'accident' | 'natural_disaster' | 'suspicious_activity' | 'domestic_violence' | 'kidnapping' | 'other'>('other');
  const [preferences, setPreferences] = useState<any>(null);

  const situationTypes = [
    { value: 'medical_emergency', label: 'Medical Emergency', icon: '🏥' },
    { value: 'fire', label: 'Fire', icon: '🔥' },
    { value: 'break_in', label: 'Break In', icon: '🔓' },
    { value: 'assault', label: 'Assault', icon: '⚠️' },
    { value: 'kidnapping', label: 'Kidnapping', icon: '🚨' },
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

      if (data) {
        setPreferences(data);
        setSelectedSituation(data.default_situation_type);
        setCountdown(data.countdown_duration);
      }
    } catch (error) {
      console.error('Error loading emergency preferences:', error);
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using a simple reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const triggerPanicAlert = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the panic button",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get current location
      const location = await getCurrentLocation();
      const address = await reverseGeocode(location.latitude, location.longitude);

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const userName = profile?.full_name || 'Someone';

      // Create panic alert in database
      const { data: panicData, error: panicError } = await supabase
        .from('panic_alerts')
        .insert({
          user_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          address,
          message: `Emergency assistance requested - ${selectedSituation}`,
          situation_type: selectedSituation
        })
        .select()
        .single();

      if (panicError) throw panicError;

      // Get user's emergency contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id);
        
      if (contactsError) throw contactsError;
      
      // Create notification for each emergency contact
      if (contacts && contacts.length > 0) {
        // Filter contacts that have app notification enabled
        const appNotificationContacts = contacts.filter(
          contact => contact.preferred_methods && contact.preferred_methods.includes('in_app')
        );
        
        // Get user IDs for emergency contacts with app accounts
        const { data: contactProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, phone')
          .in('phone', appNotificationContacts.map(c => c.phone_number));
          
        if (profilesError) throw profilesError;
        
        // Create notifications for each contact with an app account
        if (contactProfiles && contactProfiles.length > 0) {
          const notifications = contactProfiles.map(profile => ({
            recipient_id: profile.user_id,
            panic_alert_id: panicData.id,
            notification_type: 'panic_alert'
          }));
          
          const { error: notificationError } = await supabase
            .from('alert_notifications')
            .insert(notifications);
            
          if (notificationError) console.error('Error creating notifications:', notificationError);
        }
      }

      // Call emergency alert function to notify contacts
      const { error: alertFunctionError } = await supabase.functions.invoke('emergency-alert', {
        body: {
          panic_alert_id: panicData.id,
          situation_type: selectedSituation,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            address
          },
          user_name: userName
        }
      });

      if (alertFunctionError) {
        console.error('Error calling emergency alert function:', alertFunctionError);
      }

      // Create a safety alert for community visibility
      const { error: alertError } = await supabase
        .from('safety_alerts')
        .insert({
          user_id: user.id,
          title: 'Emergency Alert',
          description: `Emergency situation reported: ${situationTypes.find(s => s.value === selectedSituation)?.label}`,
          alert_type: 'other',
          severity: 'critical',
          latitude: location.latitude,
          longitude: location.longitude,
          address
        });

      if (alertError) throw alertError;

      setIsActivated(true);
      
      toast({
        title: "Emergency Alert Sent",
        description: "Your emergency contacts and authorities have been notified",
        variant: "default"
      });

      // Auto-hide after 10 seconds
      setTimeout(() => {
        setIsActivated(false);
        setIsConfirming(false);
      }, 10000);

    } catch (error: any) {
      console.error('Error sending panic alert:', error);
      
      let errorMessage = 'Failed to send emergency alert';
      if (error.message.includes('Geolocation')) {
        errorMessage = 'Location access denied. Please enable location services.';
      }
      
      toast({
        title: "Alert Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePanicButtonPress = () => {
    setIsPressed(true);
    setIsConfirming(true);
    const duration = preferences?.countdown_duration || 3;
    setCountdown(duration);

    if (duration === 0) {
      // No countdown, trigger immediately
      triggerPanicAlert();
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isPressed) {
            triggerPanicAlert();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelPanic = () => {
    setIsPressed(false);
    setIsConfirming(false);
    setCountdown(preferences?.countdown_duration || 3);
  };

  if (isActivated) {
    return (
      <Card className="border-red-500 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-full">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Emergency Alert Active</h3>
              <p className="text-sm text-red-600">Help has been notified</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsActivated(false)}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Button
        onClick={handlePanicButtonPress}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-lg animate-pulse"
        size="lg"
        disabled={loading}
      >
        <AlertTriangle className="h-5 w-5 mr-2" />
        {loading ? 'Sending...' : 'PANIC'}
      </Button>

      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Emergency Alert
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Select Emergency Situation</Label>
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 pr-2">
                  {situationTypes.map((type) => (
                    <Card 
                      key={type.value} 
                      className={`cursor-pointer transition-all hover:bg-red-50 border-2 ${
                        selectedSituation === type.value 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-muted hover:border-red-200'
                      }`}
                      onClick={() => {
                        setSelectedSituation(type.value as any);
                        // Auto-trigger alert when card is clicked
                        triggerPanicAlert();
                      }}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Select the type of emergency to send an immediate alert to your emergency contacts and authorities.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Emergency contacts will be alerted via their preferred methods
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Your real-time location will be shared
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Community members nearby will be notified
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={cancelPanic}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PanicButton;