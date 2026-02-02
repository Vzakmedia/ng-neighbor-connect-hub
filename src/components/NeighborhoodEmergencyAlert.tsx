import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ExclamationTriangleIcon, MapPinIcon, XMarkIcon, BellIcon, UsersIcon, MapIcon } from '@heroicons/react/24/outline';
import { playNotification } from '@/utils/audioUtils';
import { useNotifications } from '@/hooks/useSimpleNotifications';
import { useNativePermissions } from '@/hooks/mobile/useNativePermissions';

interface NeighborhoodEmergencyAlertProps {
  position?: 'top-center' | 'bottom-center';
}

const NeighborhoodEmergencyAlert = ({ position = 'top-center' }: NeighborhoodEmergencyAlertProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const { getCurrentPosition } = useNativePermissions();
  const { } = useNotifications(); // Emergency alerts now handled by unified system
  const [alerts, setAlerts] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
      // Add timeout and high accuracy options
      const position = await getCurrentPosition({
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 0
      });
      console.log('📍 Emergency Alert Location:', position.coords);
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error) {
      console.error('Error getting location for alerts:', error);
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
                  // Use toast for initial non-disruptive notification
                  toast({
                    title: 'New Emergency Alert',
                    description: `${(payload.new.alert_type || 'alert').replace('_', ' ').toUpperCase()} nearby`,
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
        .subscribe();
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
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
      if (alerts.length <= 1) setIsExpanded(false);
    } catch (error) {
      console.error('Error dismissing alert:', error);
      // Still remove from local state even if DB operation fails
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      if (alerts.length <= 1) setIsExpanded(false);
    }
  };

  const getDirections = async (latitude: number, longitude: number) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${latitude},${longitude}`;
      const { openUrl } = await import('@/utils/nativeBrowser');
      await openUrl(url, '_blank');
    }
  };

  // Don't show emergency alerts on auth or onboarding pages
  const isAuthPage = location.pathname.startsWith('/auth') ||
    location.pathname === '/landing' ||
    location.pathname === '/complete-profile';

  if (!user || alerts.length === 0 || isAuthPage) return null;

  const positionClasses = {
    'top-center': 'top-20 left-1/2 -translate-x-1/2', // Moved down slightly to not hit the header
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40 max-w-md w-full px-4 transition-all duration-300`}>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-orange-600 dark:bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-orange-400/30 animate-pulse-slow mx-auto group hover:scale-105 transition-transform"
        >
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span className="font-bold text-sm">
            {alerts.length} SAFETY {alerts.length === 1 ? 'ALERT' : 'ALERTS'} NEARBY
          </span>
          <div className="h-4 w-px bg-white/30 mx-1" />
          <span className="text-xs font-medium group-hover:underline">VIEW DETAILS</span>
        </button>
      ) : (
        <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(false)}
            className="absolute -top-2 -right-2 z-50 h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-100 text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>

          <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-200">
            {alerts.map((alert) => {
              const distance = userLocation ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                alert.latitude,
                alert.longitude
              ) : 0;

              return (
                <Card key={alert.id} className="mb-3 shadow-xl border-orange-200 bg-orange-50/95 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                          <Badge className="bg-orange-600 text-white border-transparent">
                            {alert.situation_type?.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-700 bg-orange-100/50">
                            {distance.toFixed(1)}km
                          </Badge>
                        </div>

                        <h4 className="font-bold text-orange-900 text-sm mb-1">
                          Action Required: Safety Alert
                        </h4>

                        <p className="text-xs text-orange-800 mb-3 leading-relaxed">
                          Reported by <span className="font-semibold">{alert.profiles?.full_name || 'Neighbor'}</span>
                          {alert.address && <span className="block mt-1 opacity-80 italic">at {alert.address}</span>}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => getDirections(alert.latitude, alert.longitude)}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-bold"
                          >
                            <MapIcon className="h-3.5 w-3.5 mr-1" />
                            MAP
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismissAlert(alert.id)}
                            className="h-8 text-xs border-orange-200 text-orange-700 hover:bg-orange-100"
                          >
                            DISMISS
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-medium text-orange-600/70">
                          {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="p-1.5 rounded-full bg-orange-100">
                          <UsersIcon className="h-3.5 w-3.5 text-orange-600" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NeighborhoodEmergencyAlert;