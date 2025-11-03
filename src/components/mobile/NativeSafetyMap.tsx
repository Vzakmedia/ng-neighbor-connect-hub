import { useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

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

        // Create the map
        const newMap = await GoogleMap.create({
          id: 'safety-map',
          element: mapRef.current!,
          apiKey: configData.apiKey,
          config: {
            center: {
              lat: center.lat,
              lng: center.lng,
            },
            zoom: zoom,
          },
        });

        // Set up marker click handler
        await newMap.setOnMarkerClickListener((marker) => {
          if (onMarkerClick) {
            onMarkerClick(marker.markerId);
          }
        });

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
  }, [isNative, center.lat, center.lng, zoom, toast, onMarkerClick]);

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
      <capacitor-google-map
        ref={mapRef}
        style={{
          display: 'inline-block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};
