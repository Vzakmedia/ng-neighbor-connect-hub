import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useBackgroundLocation } from './useBackgroundLocation';
import { useNativeStorage } from './useNativeStorage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Geofence {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  label: string;
  type: 'safe_zone' | 'alert_zone' | 'custom';
  active: boolean;
}

interface GeofenceEvent {
  geofenceId: string;
  type: 'enter' | 'exit';
  timestamp: number;
  location: { latitude: number; longitude: number };
}

const GEOFENCES_KEY = 'active_geofences';
const GEOFENCE_CHECK_INTERVAL = 60000; // Check every minute

export const useGeofencing = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [activeZone, setActiveZone] = useState<Geofence | null>(null);
  const { lastLocation } = useBackgroundLocation();
  const { getItem, setItem } = useNativeStorage();
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  // Load geofences on mount
  useEffect(() => {
    loadGeofences();
  }, []);

  // Check geofences when location updates
  useEffect(() => {
    if (lastLocation && geofences.length > 0) {
      checkGeofences();
    }
  }, [lastLocation, geofences]);

  const loadGeofences = async () => {
    const stored = await getItem(GEOFENCES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGeofences(parsed);
      } catch (error) {
        console.error('Error loading geofences:', error);
      }
    }
  };

  /**
   * Add a new geofence
   */
  const addGeofence = useCallback((geofence: Omit<Geofence, 'id'>): string => {
    const newGeofence: Geofence = {
      ...geofence,
      id: `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setGeofences(prev => {
      const updated = [...prev, newGeofence];
      setItem(GEOFENCES_KEY, JSON.stringify(updated));
      return updated;
    });

    return newGeofence.id;
  }, [setItem]);

  /**
   * Remove a geofence
   */
  const removeGeofence = useCallback((id: string) => {
    setGeofences(prev => {
      const updated = prev.filter(g => g.id !== id);
      setItem(GEOFENCES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [setItem]);

  /**
   * Update geofence
   */
  const updateGeofence = useCallback((id: string, updates: Partial<Geofence>) => {
    setGeofences(prev => {
      const updated = prev.map(g => g.id === id ? { ...g, ...updates } : g);
      setItem(GEOFENCES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [setItem]);

  /**
   * Check if current location is within any geofences
   */
  const checkGeofences = useCallback(async () => {
    if (!lastLocation) return;

    const currentLocation = {
      latitude: lastLocation.latitude,
      longitude: lastLocation.longitude
    };

    // Find all geofences containing current location
    const containingGeofences = geofences.filter(geofence => {
      if (!geofence.active) return false;
      const distance = calculateDistance(currentLocation, {
        latitude: geofence.latitude,
        longitude: geofence.longitude
      });
      return distance <= geofence.radius;
    });

    // Check for zone changes
    const newZone = containingGeofences.find(g => g.type === 'alert_zone') || 
                    containingGeofences.find(g => g.type === 'safe_zone') ||
                    containingGeofences[0] || null;

    if (newZone?.id !== activeZone?.id) {
      if (newZone) {
        handleGeofenceEnter(newZone);
      } else if (activeZone) {
        handleGeofenceExit(activeZone);
      }
      setActiveZone(newZone);
    }
  }, [lastLocation, geofences, activeZone]);

  /**
   * Handle entering a geofence
   */
  const handleGeofenceEnter = useCallback((geofence: Geofence) => {
    console.log('Entered geofence:', geofence.label);

    // Show notification based on zone type
    if (geofence.type === 'alert_zone') {
      toast({
        title: "⚠️ Alert Zone",
        description: `You've entered ${geofence.label}. Stay alert!`,
        variant: "destructive",
      });
    } else if (geofence.type === 'safe_zone') {
      toast({
        title: "✅ Safe Zone",
        description: `You've entered ${geofence.label}`,
      });
    }

    // Log event
    logGeofenceEvent({
      geofenceId: geofence.id,
      type: 'enter',
      timestamp: Date.now(),
      location: { latitude: lastLocation!.latitude, longitude: lastLocation!.longitude }
    });
  }, [toast, lastLocation]);

  /**
   * Handle exiting a geofence
   */
  const handleGeofenceExit = useCallback((geofence: Geofence) => {
    console.log('Exited geofence:', geofence.label);

    // Log event
    logGeofenceEvent({
      geofenceId: geofence.id,
      type: 'exit',
      timestamp: Date.now(),
      location: { latitude: lastLocation!.latitude, longitude: lastLocation!.longitude }
    });
  }, [lastLocation]);

  /**
   * Create geofences around nearby emergency alerts
   */
  const createAlertGeofences = useCallback(async (userLocation: { latitude: number; longitude: number }) => {
    try {
      // Fetch recent emergency alerts within 5km
      const { data: alerts } = await supabase
        .from('emergency_alerts')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (!alerts) return;

      // Clear old alert geofences
      setGeofences(prev => prev.filter(g => g.type !== 'alert_zone'));

      // Create new geofences for active alerts
      alerts.forEach(alert => {
        if (alert.latitude && alert.longitude) {
          const distance = calculateDistance(userLocation, {
            latitude: alert.latitude,
            longitude: alert.longitude
          });

          // Only create geofence if alert is within 5km
          if (distance <= 5000) {
            addGeofence({
              latitude: alert.latitude,
              longitude: alert.longitude,
              radius: 500, // 500m radius around alert
              label: alert.title || 'Emergency Alert',
              type: 'alert_zone',
              active: true
            });
          }
        }
      });
    } catch (error) {
      console.error('Error creating alert geofences:', error);
    }
  }, [addGeofence]);

  /**
   * Log geofence event (can be sent to analytics or stored locally)
   */
  const logGeofenceEvent = (event: GeofenceEvent) => {
    console.log('Geofence event:', event);
    // Implement analytics logging here if needed
  };

  return {
    geofences,
    activeZone,
    addGeofence,
    removeGeofence,
    updateGeofence,
    createAlertGeofences,
    isNative
  };
};

// Helper: Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (
  loc1: { latitude: number; longitude: number },
  loc2: { latitude: number; longitude: number }
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (loc1.latitude * Math.PI) / 180;
  const φ2 = (loc2.latitude * Math.PI) / 180;
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
