import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { useNativeStorage } from './useNativeStorage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const LOCATION_CACHE_KEY = 'last_known_location';
const LOCATION_UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes
const SIGNIFICANT_DISTANCE_THRESHOLD = 100; // meters

interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
}

export const useBackgroundLocation = () => {
  const [lastLocation, setLastLocation] = useState<CachedLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { getItem, setItem } = useNativeStorage();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();

  // Load cached location on mount
  useEffect(() => {
    loadCachedLocation();
  }, []);

  // Start periodic location updates
  useEffect(() => {
    if (isNative && isTracking) {
      const interval = setInterval(() => {
        updateLocation();
      }, LOCATION_UPDATE_INTERVAL);

      // Get initial location
      updateLocation();

      return () => clearInterval(interval);
    }
  }, [isNative, isTracking]);

  const loadCachedLocation = async () => {
    const cached = await getItem(LOCATION_CACHE_KEY);
    if (cached) {
      try {
        const location = JSON.parse(cached);
        setLastLocation(location);
      } catch (error) {
        console.error('Error loading cached location:', error);
      }
    }
  };

  /**
   * Update user's location in the background
   */
  const updateLocation = useCallback(async (highAccuracy = false) => {
    if (!isNative) return;

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 30000
      });

      const newLocation: CachedLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy
      };

      // Check if location changed significantly
      const shouldUpdate = !lastLocation || 
        calculateDistance(lastLocation, newLocation) > SIGNIFICANT_DISTANCE_THRESHOLD;

      if (shouldUpdate) {
        // Cache location locally
        await setItem(LOCATION_CACHE_KEY, JSON.stringify(newLocation));
        setLastLocation(newLocation);

        // Update database if user is authenticated
        if (user) {
          await supabase
            .from('profiles')
            .update({
              last_known_location: `POINT(${newLocation.longitude} ${newLocation.latitude})`,
              last_location_update: new Date().toISOString()
            })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [isNative, lastLocation, user, setItem]);

  /**
   * Get current location with smart caching
   */
  const getCurrentLocation = useCallback(async (
    forceRefresh = false
  ): Promise<CachedLocation | null> => {
    // Return cached if available and recent
    if (!forceRefresh && lastLocation) {
      const age = Date.now() - lastLocation.timestamp;
      if (age < LOCATION_UPDATE_INTERVAL) {
        return lastLocation;
      }
    }

    // Get fresh location
    await updateLocation(true);
    return lastLocation;
  }, [lastLocation, updateLocation]);

  /**
   * Start background location tracking
   */
  const startTracking = useCallback(() => {
    if (!isNative) {
      toast({
        title: "Not available",
        description: "Background location is only available on mobile",
        variant: "destructive"
      });
      return;
    }

    setIsTracking(true);
    toast({
      title: "Location tracking enabled",
      description: "Your location will be updated periodically for better emergency alerts",
    });
  }, [isNative, toast]);

  /**
   * Stop background location tracking
   */
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    toast({
      title: "Location tracking disabled",
      description: "Background location updates have been stopped",
    });
  }, [toast]);

  /**
   * Check if location needs update
   */
  const needsUpdate = useCallback(() => {
    if (!lastLocation) return true;
    const age = Date.now() - lastLocation.timestamp;
    return age > LOCATION_UPDATE_INTERVAL;
  }, [lastLocation]);

  return {
    lastLocation,
    isTracking,
    getCurrentLocation,
    updateLocation,
    startTracking,
    stopTracking,
    needsUpdate,
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
