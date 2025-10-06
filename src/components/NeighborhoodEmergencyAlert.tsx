import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, MapPin, X, Bell, Users, Navigation } from 'lucide-react';
import { playNotification } from '@/utils/audioUtils';
import { useNotifications } from '@/hooks/useSimpleNotifications';
import { useNativePermissions } from '@/hooks/mobile/useNativePermissions';

interface NeighborhoodEmergencyAlertProps {
  position?: 'top-center' | 'bottom-center';
}

const NeighborhoodEmergencyAlert = ({ position = 'top-center' }: NeighborhoodEmergencyAlertProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCurrentPosition } = useNativePermissions();
  const { } = useNotifications(); // Emergency alerts now handled by unified system
  const [alerts, setAlerts] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (user) {
      getUserLocation();
      subscribeToSafetyAlerts();
    }
    
    return () => {
      try {
        const subscription = supabase.channel('safety-alerts-public');
        supabase.removeChannel(subscription);
        
        // Clear polling fallback if it exists
        if ((window as any).publicAlertsPoll) {
          clearInterval((window as any).publicAlertsPoll);
          delete (window as any).publicAlertsPoll;
        }
      } catch (error) {
        console.error('Error cleaning up safety alerts subscriptions:', error);
      }
    };
  }, [user]);

  useEffect(() => {
    if (userLocation) {
      loadNearbyAlerts();
    }
  }, [userLocation]);

  const getUserLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadNearbyAlerts = async () => {
    if (!user || !userLocation) return;
    
    try {
      // Get dismissed alerts for this user
      const { data: dismissedAlerts } = await supabase
        .from('dismissed_alerts')
        .select('alert_id')
        .eq('user_id', user.id);
      
      const dismissedAlertIds = new Set(dismissedAlerts?.map(d => d.alert_id) || []);
      
      // Query safety_alerts instead of public_emergency_alerts (which was removed)
      const { data: safetyAlerts, error } = await supabase
        .from('safety_alerts')
        .select(`
          id,
          alert_type,
          latitude,
          longitude,
          address,
          severity,
          created_at,
          status,
          user_id,
          title,
          description,
          profiles:user_id (
            full_name
          )
        `)
        .eq('status', 'active')
        .neq('user_id', user.id) // Don't show user's own alerts
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Filter alerts by distance (within 10km), exclude dismissed alerts, and convert to expected format
      const nearbyAlerts = (safetyAlerts || [])
        .filter(alert => {
          if (!alert.latitude || !alert.longitude) return false;
          if (dismissedAlertIds.has(alert.id)) return false; // Skip dismissed alerts
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            alert.latitude,
            alert.longitude
          );
          return distance <= 10; // 10km radius
        })
        .map(alert => ({
          id: alert.id,
          situation_type: alert.alert_type,
          latitude: alert.latitude,
          longitude: alert.longitude,
          address: alert.address,
          radius_km: 10, // Default radius
          created_at: alert.created_at,
          is_active: true,
          user_id: alert.user_id,
          profiles: alert.profiles
        }));
      
      setAlerts(nearbyAlerts);
    } catch (error) {
      console.error('Error loading nearby alerts:', error);
    }
  };

  const subscribeToSafetyAlerts = () => {
    try {
      const subscription = supabase.channel('safety-alerts-public')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'safety_alerts'
          },
          (payload) => {
            if (payload.new && payload.new.user_id !== user?.id) {
              if (userLocation) {
                const distance = calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  payload.new.latitude,
                  payload.new.longitude
                );
                if (distance <= 10) {
                  toast({
                    title: 'Emergency alert near you',
                    description: `${(payload.new.alert_type || 'alert').replace('_', ' ')} • ${payload.new.severity}`,
                    variant: 'destructive',
                  });
                  loadNearbyAlerts();
                }
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'safety_alerts'
          },
          () => {
            loadNearbyAlerts();
          }
        )
        .subscribe((status) => {
          console.log('Safety alerts subscription status:', status);
          if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to safety alerts - falling back to polling');
            const pollInterval = setInterval(() => {
              loadNearbyAlerts();
            }, 60000);
            (window as any).publicAlertsPoll = pollInterval;
          }
        });
    } catch (error) {
      console.error('Error subscribing to safety alerts:', error);
      const pollInterval = setInterval(() => {
        loadNearbyAlerts();
      }, 60000);
      (window as any).publicAlertsPoll = pollInterval;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  const dismissAlert = async (alertId: string) => {
    if (!user) return;
    
    try {
      // Store dismissal in database
      await supabase
        .from('dismissed_alerts')
        .insert({
          user_id: user.id,
          alert_id: alertId
        });
      
      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
      // Still remove from local state even if DB operation fails
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }
  };

  const getDirections = (latitude: number, longitude: number) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  if (!user || alerts.length === 0) return null;

  const positionClasses = {
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40 max-w-md w-full mx-4`}>
      {alerts.map((alert) => {
        const distance = userLocation ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          alert.latitude,
          alert.longitude
        ) : 0;

        return (
          <Card key={alert.id} className="mb-3 shadow-lg border-orange-200 bg-orange-50 animate-pulse-slow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <Badge className="bg-orange-600 text-white">
                      {alert.situation_type?.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {distance.toFixed(1)}km away
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold text-orange-800 mb-1">
                    Emergency Alert in Your Area
                  </h4>
                  
                  <p className="text-sm text-orange-700 mb-2">
                    Reported by {alert.profiles?.full_name || 'A neighbor'}
                  </p>
                  
                  {alert.address && (
                    <p className="text-xs text-orange-600 flex items-center gap-1 mb-3">
                      <MapPin className="h-3 w-3" />
                      {alert.address}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => getDirections(alert.latitude, alert.longitude)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Get Directions
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground mb-2">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default NeighborhoodEmergencyAlert;