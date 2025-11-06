import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin } from 'lucide-react';

interface MarketplaceMapProps {
  location: string;
  title: string;
}

export const MarketplaceMap = ({ location, title }: MarketplaceMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get Google Maps API key from edge function
        const { data: config } = await fetch('/api/get-google-maps-token').then(res => res.json());
        
        if (!config?.api_key) {
          setError('Map unavailable');
          setLoading(false);
          return;
        }

        const loader = new Loader({
          apiKey: config.api_key,
          version: 'weekly',
          libraries: ['places', 'geocoding']
        });

        const { Map } = await loader.importLibrary('maps');
        const { Geocoder } = await loader.importLibrary('geocoding');

        if (!mapRef.current) return;

        // Geocode the location string
        const geocoder = new Geocoder();
        geocoder.geocode({ address: location }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const position = results[0].geometry.location;

            const mapInstance = new Map(mapRef.current!, {
              center: position,
              zoom: 13,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            });

            // Add marker
            new google.maps.Marker({
              position: position,
              map: mapInstance,
              title: title,
            });

            setMap(mapInstance);
            setLoading(false);
          } else {
            setError('Location not found');
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error loading map:', err);
        setError('Failed to load map');
        setLoading(false);
      }
    };

    initMap();
  }, [location, title]);

  if (error || loading) {
    return (
      <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center border">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">{loading ? 'Loading map...' : error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-40 rounded-lg border"
    />
  );
};