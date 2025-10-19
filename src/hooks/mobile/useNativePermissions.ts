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

  const getCurrentPosition = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    if (!isNative) {
      // Web fallback
      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });

      // Convert to browser GeolocationPosition format for compatibility
      return {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        },
        timestamp: position.timestamp
      } as GeolocationPosition;
    } catch (error) {
      console.error('Error getting position:', error);
      throw error;
    }
  }, [isNative, requestLocationPermission]);

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
