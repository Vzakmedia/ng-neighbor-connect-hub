import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock, 
  Shield,
  Zap,
  CheckCircle,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const PanicButton = () => {
  const { user } = useAuth();
  const [isPressed, setIsPressed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

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

      // Create panic alert in database
      const { error: panicError } = await supabase
        .from('panic_alerts')
        .insert({
          user_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          address,
          message: 'Emergency assistance requested'
        });

      if (panicError) throw panicError;

      // Create a safety alert as well for community visibility
      const { error: alertError } = await supabase
        .from('safety_alerts')
        .insert({
          user_id: user.id,
          title: 'Emergency Alert',
          description: 'Someone in your area has requested emergency assistance',
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
        description: "Your emergency contacts and local authorities have been notified",
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
    setCountdown(3);

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
    setCountdown(3);
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
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Emergency alert will be sent in {countdown} seconds</strong>
                <br />
                This will notify your emergency contacts and local authorities with your location.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Emergency contacts will be called
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Your location will be shared
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Local authorities will be notified
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
              <Button
                onClick={triggerPanicAlert}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Send Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PanicButton;