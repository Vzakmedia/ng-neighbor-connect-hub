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
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'when-in-use'>('prompt');
  const { getItem, setItem } = useNativeStorage();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';

  // Load cached location and check permission status on mount
  useEffect(() => {
    loadCachedLocation();
    checkLocationPermissionStatus();
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
   * Check current location permission status
   */
  const checkLocationPermissionStatus = async () => {
    if (!isNative) return;

    try {
      const result = await Geolocation.checkPermissions();
      
      if (result.location === 'granted') {
        // On iOS, check if we have "Always" or just "When In Use"
        if (isIOS && result.coarseLocation === 'granted') {
          setPermissionStatus('when-in-use');
        } else {
          setPermissionStatus('granted');
        }
      } else if (result.location === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('prompt');
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  /**
   * Request "Always" location permission (iOS)
   */
  const requestAlwaysPermission = async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      // First explain why we need "Always" permission
      if (isIOS && permissionStatus !== 'granted') {
        toast({
          title: "Background Location Required",
          description: "For emergency alerts and safety features to work in the background, please select 'Allow While Using App' or 'Always' when prompted.",
          duration: 6000,
        });
      }

      // Request permission
      const result = await Geolocation.requestPermissions();
      
      if (result.location === 'granted') {
        setPermissionStatus('granted');
        return true;
      } else if (result.location === 'denied') {
        setPermissionStatus('denied');
        
        // iOS-specific guidance
        if (isIOS) {
          toast({
            title: "Location Permission Denied",
            description: "To enable background location, go to Settings > Privacy > Location Services > NeighborLink and select 'Always'",
            variant: "destructive",
            duration: 8000,
          });
        } else {
          toast({
            title: "Location Permission Denied",
            description: "Please enable location permission in your device settings",
            variant: "destructive",
          });
        }
        return false;
      }
      
      setPermissionStatus('when-in-use');
      return false;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request location permission",
        variant: "destructive",
      });
      return false;
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
  const startTracking = useCallback(async () => {
    if (!isNative) {
      toast({
        title: "Not available",
        description: "Background location is only available on mobile",
        variant: "destructive"
      });
      return;
    }

    // Check if we have permission, request if needed
    if (permissionStatus !== 'granted') {
      const granted = await requestAlwaysPermission();
      if (!granted) {
        return;
      }
    }

    setIsTracking(true);
    toast({
      title: "Location tracking enabled",
      description: "Your location will be updated periodically for better emergency alerts",
    });
  }, [isNative, permissionStatus, toast]);

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
    permissionStatus,
    getCurrentLocation,
    updateLocation,
    startTracking,
    stopTracking,
    needsUpdate,
    requestAlwaysPermission,
    checkLocationPermissionStatus,
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
