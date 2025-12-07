import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  snippet: string;
  type: 'alert' | 'incident' | 'user';
}

interface NativeSafetyMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (markerId: string) => void;
}

export const NativeSafetyMap = ({ 
  center = { lat: 9.082, lng: 8.6753 }, // Abuja, Nigeria
  zoom = 12,
  markers = [],
  onMarkerClick,
}: NativeSafetyMapProps) => {
  const mapRef = useRef<HTMLElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();
  const isNative = isNativePlatform();

  // Get user's current location
  useEffect(() => {
    if (!isNative) return;

    const getUserLocation = async () => {
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
        console.log('Geolocation error:', error);
        // Use default center if location access denied
      }
    };

    getUserLocation();
  }, [isNative]);

  // Initialize map
  useEffect(() => {
    if (!isNative || !mapRef.current) return;

    const initMap = async () => {
      try {
        setIsLoading(true);

        // Get Google Maps API key from edge function
        const { data: configData, error: configError } = await supabase.functions.invoke(
          'get-google-maps-token'
        );

        if (configError || !configData?.apiKey) {
          throw new Error('Failed to get Google Maps API key');
        }

        // Use user location if available, otherwise use default center
        const mapCenter = userLocation || center;

        // Dynamically import GoogleMap
        const { GoogleMap } = await import('@capacitor/google-maps');

        // Create the map
        const newMap = await GoogleMap.create({
          id: 'safety-map',
          element: mapRef.current!,
          apiKey: configData.apiKey,
          config: {
            center: {
              lat: mapCenter.lat,
              lng: mapCenter.lng,
            },
            zoom: userLocation ? 14 : zoom, // Zoom in more if we have user location
          },
        });

        // Set up marker click handler
        await newMap.setOnMarkerClickListener((marker) => {
          if (onMarkerClick) {
            onMarkerClick(marker.markerId);
          }
        });

        // Add marker for user's location if available
        if (userLocation) {
          await newMap.addMarkers([{
            coordinate: {
              lat: userLocation.lat,
              lng: userLocation.lng,
            },
            title: 'Your Location',
            snippet: 'You are here',
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          }]);
        }

        setMap(newMap);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing native map:', error);
        toast({
          title: 'Map Error',
          description: 'Failed to load map. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [isNative, center.lat, center.lng, zoom, toast, onMarkerClick, userLocation]);

  // Update markers when they change
  useEffect(() => {
    if (!map || !markers.length) return;

    const updateMarkers = async () => {
      try {
        // Clear existing markers (API doesn't have getMapMarkers, so we'll just remove all)
        await map.removeMarkers([]);

        // Add new markers
        const newMarkers = markers.map(marker => ({
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
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      <div
        ref={mapRef as any}
        style={{
          display: 'inline-block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};
