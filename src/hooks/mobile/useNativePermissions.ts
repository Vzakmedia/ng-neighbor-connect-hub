import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { useToast } from '@/hooks/use-toast';

export type PermissionType = 'location' | 'camera' | 'photos';

export const useNativePermissions = () => {
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      // Web fallback - use browser API
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          toast({
            title: "Location not supported",
            description: "Your browser doesn't support location services",
            variant: "destructive",
          });
          resolve(false);
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => {
            toast({
              title: "Location permission denied",
              description: "Please enable location access in your browser settings",
              variant: "destructive",
            });
            resolve(false);
          }
        );
      });
    }

    try {
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location === 'granted') {
        return true;
      }
      
      if (permission.location === 'denied') {
        toast({
          title: "Location permission denied",
          description: "Please enable location access in your device settings",
          variant: "destructive",
        });
        return false;
      }

      // Request permission
      const result = await Geolocation.requestPermissions();
      
      if (result.location === 'granted') {
        return true;
      }
      
      toast({
        title: "Location permission required",
        description: "NeighborLink needs location access for nearby posts and emergency alerts",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      toast({
        title: "Permission error",
        description: "Failed to request location permission",
        variant: "destructive",
      });
      return false;
    }
  }, [isNative, toast]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      // Web fallback - will be handled by file input
      return true;
    }

    try {
      const permission = await Camera.checkPermissions();
      
      if (permission.camera === 'granted' && permission.photos === 'granted') {
        return true;
      }
      
      if (permission.camera === 'denied' || permission.photos === 'denied') {
        toast({
          title: "Camera permission denied",
          description: "Please enable camera and photo access in your device settings",
          variant: "destructive",
        });
        return false;
      }

      // Request permission
      const result = await Camera.requestPermissions();
      
      if (result.camera === 'granted' && result.photos === 'granted') {
        return true;
      }
      
      toast({
        title: "Camera permission required",
        description: "NeighborLink needs camera access to upload photos",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      toast({
        title: "Permission error",
        description: "Failed to request camera permission",
        variant: "destructive",
      });
      return false;
    }
  }, [isNative, toast]);

  const getCurrentPosition = useCallback(async (desiredAccuracy: number = 25): Promise<GeolocationPosition> => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    // Validate position helper
    const validatePosition = (pos: GeolocationPosition): GeolocationPosition => {
      const { latitude, longitude, accuracy } = pos.coords;
      
      // Check for (0,0) or near-zero coordinates
      if (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001) {
        throw new Error('Invalid coordinates: (0,0) returned by GPS');
      }
      
      // Check for NaN or undefined
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid coordinates: NaN or undefined');
      }
      
      // Check if coordinates are in Nigeria bounds
      const NIGERIA_BOUNDS = {
        north: 13.9,
        south: 4.3,
        east: 14.7,
        west: 2.7
      };
      
      if (
        latitude < NIGERIA_BOUNDS.south || 
        latitude > NIGERIA_BOUNDS.north ||
        longitude < NIGERIA_BOUNDS.west || 
        longitude > NIGERIA_BOUNDS.east
      ) {
        console.warn(`⚠️ Coordinates outside Nigeria: ${latitude}, ${longitude}`);
        // Don't throw - allow but log warning
      }
      
      console.log(`✅ Coordinates validated: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy}m)`);
      return pos;
    };

    return new Promise((resolve, reject) => {
      // Use navigator.geolocation for both web and native (Capacitor uses this)
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported'));
      }

      let best: GeolocationPosition | null = null;
      let attempts = 0;
      const maxAttempts = 5;

      const tryGet = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const acc = pos.coords.accuracy;
            console.log(`📍 GPS Attempt ${attempts + 1}/${maxAttempts}: ±${acc.toFixed(1)}m`);
            attempts++;

            // Keep the best position we've seen
            if (!best || acc < best.coords.accuracy) {
              best = pos;
              console.log(`🎯 New best: ±${acc.toFixed(1)}m`);
            }

            // Success criteria: Met desired accuracy OR exhausted attempts
            if (acc <= desiredAccuracy) {
              console.log(`✅ Target accuracy achieved: ±${acc.toFixed(1)}m`);
              resolve(validatePosition(best));
            } else if (attempts >= maxAttempts) {
              console.log(`⏱️ Max attempts reached. Best: ±${best.coords.accuracy.toFixed(1)}m`);
              resolve(validatePosition(best));
            } else {
              // Try again after short delay
              setTimeout(tryGet, 1500);
            }
          },
          (err) => {
            console.error(`❌ GPS error on attempt ${attempts + 1}:`, err);
            // If we have ANY position, return it rather than failing
            if (best) {
              console.log(`⚠️ Returning best position despite error: ±${best.coords.accuracy.toFixed(1)}m`);
              resolve(validatePosition(best));
            } else {
              reject(err);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 8000, // 8 seconds per attempt
            maximumAge: 0, // Never use cached position
          }
        );
      };

      tryGet();
    });
  }, [requestLocationPermission]);

  const openAppSettings = useCallback(() => {
    if (!isNative) return;
    
    // Open device settings
    if (Capacitor.getPlatform() === 'ios') {
      window.open('app-settings:');
    } else if (Capacitor.getPlatform() === 'android') {
      // Android will need a plugin or direct intent
      toast({
        title: "Settings",
        description: "Please open Settings > Apps > NeighborLink > Permissions",
      });
    }
  }, [isNative, toast]);

  return {
    isNative,
    requestLocationPermission,
    requestCameraPermission,
    getCurrentPosition,
    openAppSettings
  };
};
