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

  const getCurrentPosition = useCallback(async (
    desiredAccuracy: number = 25,
    onUpdate?: (position: GeolocationPosition) => void
  ): Promise<GeolocationPosition> => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    // Browser capability detection
    const detectGPSCapability = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isDesktop = !(/android|iphone|ipad|ipod/.test(userAgent));
      
      if (isDesktop) {
        console.warn('⚠️ Desktop browser detected. GPS accuracy may be limited to Wi-Fi/IP positioning.');
        console.warn('   For best results, use a mobile device or enable location sharing in browser.');
      } else if (/chrome/.test(userAgent)) {
        console.log('✅ Chrome mobile detected. Good GPS support.');
      } else if (/safari/.test(userAgent)) {
        console.log('✅ Safari mobile detected. Good GPS support.');
      }
    };

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

    detectGPSCapability();

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported'));
      }

      let best: GeolocationPosition | null = null;
      let attempts = 0;
      const startTime = Date.now();
      const maxTotalTime = 120000; // 2 minutes total
      
      // Use watchPosition to activate GPS hardware and continuously improve
      console.log('🛰️ Activating GPS hardware...');
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const acc = pos.coords.accuracy;
          const { latitude, longitude, altitude, speed, heading } = pos.coords;
          const elapsed = Date.now() - startTime;
          
          console.log(`📍 GPS Update ${attempts + 1}: ±${acc.toFixed(1)}m (${(elapsed/1000).toFixed(1)}s elapsed)`);
          console.log(`   Coords: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          console.log(`   Altitude: ${altitude ?? 'N/A'}m`);
          console.log(`   Speed: ${speed ?? 'N/A'}m/s`);
          console.log(`   Heading: ${heading ?? 'N/A'}°`);
          console.log(`   Timestamp: ${new Date(pos.timestamp).toISOString()}`);
          
          // Call onUpdate callback if provided
          if (onUpdate) {
            onUpdate(pos);
          }
          
          // Detect if this is cell tower / IP-based positioning
          if (acc > 1000) {
            console.warn(`⚠️ WARNING: Very poor accuracy (${acc}m). GPS satellites not acquired.`);
            console.warn(`   Possible causes:`);
            console.warn(`   - Indoor location (GPS signals blocked)`);
            console.warn(`   - GPS hardware not active`);
            console.warn(`   - Browser using IP/cell tower positioning`);
            console.warn(`   - Location permissions restricted`);
          }
          
          attempts++;

          // Track best position
          if (!best || acc < best.coords.accuracy) {
            best = pos;
            console.log(`🎯 New best: ±${acc.toFixed(1)}m`);
          }

          // Success: Met desired accuracy
          if (acc <= desiredAccuracy) {
            console.log(`✅ Target accuracy achieved: ±${acc.toFixed(1)}m`);
            navigator.geolocation.clearWatch(watchId);
            resolve(validatePosition(best));
          }
          
          // Timeout: Return best we got
          if (elapsed >= maxTotalTime) {
            console.log(`⏱️ Stopping GPS acquisition. Best: ±${best.coords.accuracy.toFixed(1)}m`);
            navigator.geolocation.clearWatch(watchId);
            
            // Accept coordinates within Lagos area even if accuracy is poor
            const LAGOS_BOUNDS = {
              north: 6.7,
              south: 6.4,
              east: 3.7,
              west: 3.1
            };
            
            const inLagos = (
              best.coords.latitude >= LAGOS_BOUNDS.south &&
              best.coords.latitude <= LAGOS_BOUNDS.north &&
              best.coords.longitude >= LAGOS_BOUNDS.west &&
              best.coords.longitude <= LAGOS_BOUNDS.east
            );
            
            if (best.coords.accuracy > 100) {
              if (inLagos) {
                console.warn(`⚠️ Very poor accuracy (${best.coords.accuracy}m), but coordinates are in Lagos area - accepting`);
                resolve(validatePosition(best));
              } else {
                console.error('❌ GPS failed to acquire satellites. Accuracy too poor.');
                reject(new Error(`GPS accuracy too poor: ±${best.coords.accuracy.toFixed(0)}m. Move outdoors for better signal.`));
              }
            } else {
              resolve(validatePosition(best));
            }
          }
        },
        (err) => {
          console.error('❌ GPS error:', err);
          navigator.geolocation.clearWatch(watchId);
          
          if (best && best.coords.accuracy <= 100) {
            resolve(validatePosition(best));
          } else {
            reject(new Error('GPS failed to acquire accurate position. Please ensure location services are enabled and you have clear sky view.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // 30 seconds per update
          maximumAge: 0, // Never use cached position
        }
      );

      // Safety timeout
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        if (best) {
          if (best.coords.accuracy > 100) {
            reject(new Error(`GPS timeout. Best accuracy: ±${best.coords.accuracy.toFixed(0)}m. Move outdoors for better GPS signal.`));
          } else {
            resolve(validatePosition(best));
          }
        } else {
          reject(new Error('GPS timeout with no position acquired'));
        }
      }, maxTotalTime);
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
