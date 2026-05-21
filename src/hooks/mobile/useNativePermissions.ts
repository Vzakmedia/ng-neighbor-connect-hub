import { useCallback } from 'react';
const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;
const getCapacitorPlatform = () => (window as any).Capacitor?.getPlatform?.() || 'web';
import { useToast } from '@/hooks/use-toast';

export type PermissionType = 'location' | 'camera' | 'photos' | 'microphone';

export const useNativePermissions = () => {
  const { toast } = useToast();
  const isNative = isNativePlatform();

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
      const { Geolocation } = await import('@capacitor/geolocation');
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
      const { Camera } = await import('@capacitor/camera');
      const permission = await Camera.checkPermissions();
      
      // WR-15: Accept 'granted' or 'limited' for photos
      if (permission.camera === 'granted' && (permission.photos === 'granted' || permission.photos === 'limited')) {
        return true;
      }

      // WR-15: Allow 'limited' photo permission to proceed; only block on 'denied'
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
      
      // WR-15: Accept 'granted' or 'limited' for photos
      if (result.camera === 'granted' && (result.photos === 'granted' || result.photos === 'limited')) {
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

  const getCurrentPosition = useCallback(async (options?: Partial<PositionOptions>) => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const toGeolocationPosition = (position: any): GeolocationPosition => ({
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? null,
        altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
        heading: position.coords.heading ?? null,
        speed: position.coords.speed ?? null,
      },
      timestamp: position.timestamp,
    } as GeolocationPosition);

    const tryGet = async (opts: PositionOptions): Promise<GeolocationPosition> => {
      if (!isNative) {
        return new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(toGeolocationPosition(pos)),
            reject,
            opts
          );
        });
      }
      const { Geolocation } = await import('@capacitor/geolocation');
      const position = await Geolocation.getCurrentPosition(opts);
      return toGeolocationPosition(position);
    };

    // Stage 1: network/wifi location — fast, good enough for most use cases.
    // Uses a 5-minute cache so repeated calls don't re-acquire a GPS fix.
    try {
      return await tryGet({
        enableHighAccuracy: false,
        timeout: options?.timeout ?? 8000,
        maximumAge: options?.maximumAge ?? 300000,
      });
    } catch {
      // Stage 2: GPS fallback — slower but more accurate.
      try {
        return await tryGet({
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        });
      } catch (error) {
        console.error('Error getting position:', error);
        throw error;
      }
    }
  }, [isNative, requestLocationPermission]);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      // For both native and web, use Web API since Capacitor doesn't have a microphone plugin
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.error('Microphone access error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "Microphone permission denied",
          description: "Please enable microphone access in your device settings",
          variant: "destructive",
        });
        return false;
      }
      
      if (error.name === 'NotFoundError') {
        toast({
          title: "No microphone found",
          description: "Please connect a microphone to use voice features",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Permission error",
        description: "Failed to request microphone permission",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const openAppSettings = useCallback(() => {
    if (!isNative) return;

    // WR-14: Wrap window.open in try/catch
    if (getCapacitorPlatform() === 'ios') {
      try {
        window.open('app-settings:');
      } catch (error) {
        console.error('Failed to open app settings:', error);
        toast({
          title: "Settings",
          description: "Please open Settings > NeighborLink > Permissions",
          variant: "destructive",
        });
      }
    } else if (getCapacitorPlatform() === 'android') {
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
    requestMicrophonePermission,
    getCurrentPosition,
    openAppSettings
  };
};
