import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  USER_LOCATION_ZOOM,
  isNativePlatform,
  MapLocation
} from '@/utils/map-utils';

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  snippet: string;
  type: 'alert' | 'incident' | 'user';
}

interface NativeSafetyMapProps {
  center?: MapLocation;
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (markerId: string) => void;
}

export const NativeSafetyMap = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
}: NativeSafetyMapProps) => {
  const mapRef = useRef<HTMLElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
  const { toast } = useToast();
  const isNative = isNativePlatform();

  // Create refs to prevent re-running the initialization effect when props change
  const mapId = useRef('safety-map-' + Math.random().toString(36).substring(2, 9));
  const onMarkerClickRef = useRef(onMarkerClick);
  const toastRef = useRef(toast);
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);

  // Keep callback and toast refs updated
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Get user's current location
  useEffect(() => {
    if (!isNative) return;

    const getUserLocation = async () => {
      // WR-21: try/catch with user-facing error on failure
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 5000,
        });

        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } catch (error) {
        console.warn('Geolocation error:', error);
        toastRef.current({
          title: 'Location Unavailable',
          description: 'Could not get your location. The map will use the default area.',
          variant: 'destructive',
        });
        // Fall through — map will use default center
      }
    };

    getUserLocation();
  }, [isNative]);

  // Initialize map — runs exactly once on mount.
  useEffect(() => {
    if (!isNative || !mapRef.current) return;

    const initMap = async () => {
      try {
        setIsLoading(true);

        let apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          const { data: configData, error: configError } = await supabase.functions.invoke(
            'get-google-maps-token'
          );

          if (configError || !configData?.token) {
            throw new Error('Failed to get Google Maps API key');
          }

          // WR-20: Validate API key format before using it
          if (!/^AIza[A-Za-z0-9_\-]{35}$/.test(configData.token)) {
            throw new Error('Invalid API key');
          }

          apiKey = configData.token;
        }

        const { GoogleMap } = await import('@capacitor/google-maps');

        const newMap = await GoogleMap.create({
          id: mapId.current,
          element: mapRef.current!,
          apiKey: apiKey,
          config: {
            center: { lat: initialCenterRef.current.lat, lng: initialCenterRef.current.lng },
            zoom: initialZoomRef.current,
          },
        });

        await newMap.setOnMarkerClickListener((marker) => {
          if (onMarkerClickRef.current) {
            onMarkerClickRef.current(marker.markerId);
          }
        });

        mapInstanceRef.current = newMap;
        setMap(newMap);
        setIsLoading(false);
        document.documentElement.classList.add('native-map-active');
      } catch (error) {
        console.error('Error initializing native map:', error);
        toastRef.current({
          title: 'Map Error',
          description: 'Failed to load map. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      document.documentElement.classList.remove('native-map-active');
      // Use ref to avoid stale closure capturing an old map state value.
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, [isNative]);

  // Pan map when center or zoom props change from parent
  useEffect(() => {
    if (!map) return;
    map.setCamera({ coordinate: { lat: center.lat, lng: center.lng }, zoom });
  }, [map, center.lat, center.lng, zoom]);

  // Pan to user location once map is ready, without re-initializing the map.
  useEffect(() => {
    if (!map || !userLocation) return;

    map.setCamera({ coordinate: { lat: userLocation.lat, lng: userLocation.lng }, zoom: USER_LOCATION_ZOOM });

    map.addMarkers([{
      coordinate: { lat: userLocation.lat, lng: userLocation.lng },
      title: 'Your Location',
      snippet: 'You are here',
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    }]).catch((err: any) => console.warn('Could not add user marker:', err));
  }, [map, userLocation]);

  // Update markers when they change
  useEffect(() => {
    if (!map || !markers || !markers.length) return;

    const updateMarkers = async () => {
      try {
        await map.removeAllMapMarkers();

        // Add new markers
        const newMarkers = (markers || []).map(marker => ({
          coordinate: {
            lat: marker.latitude,
            lng: marker.longitude,
          },
          title: marker.title,
          snippet: marker.snippet,
          // Different icons for different types
          iconUrl: marker.type === 'alert'
            ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
            : marker.type === 'incident'
              ? 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
              : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        }));

        await map.addMarkers(newMarkers);
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };

    updateMarkers();
  }, [map, markers]);

  if (!isNative) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p className="text-muted-foreground">Native map only available on mobile</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-transparent">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      <div
        ref={mapRef as any}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
};
