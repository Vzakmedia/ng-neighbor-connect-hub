import { useEffect, useState } from 'react';
import { MapPin } from '@/lib/icons';
import { CapacitorAwareMap, MapCoords, MapMarker } from '@/components/maps/CapacitorAwareMap';
import { useMapApiKey } from '@/hooks/useMapApiKey';

interface MarketplaceMapProps {
  location: string;
  title: string;
}

export const MarketplaceMap = ({ location, title }: MarketplaceMapProps) => {
  const { apiKey } = useMapApiKey();
  const [coords, setCoords] = useState<MapCoords | null>(null);
  const [geocodeError, setGeocodeError] = useState(false);

  // Geocode the address string once we have the API key
  useEffect(() => {
    if (!apiKey || !location) return;

    let cancelled = false;

    const geocode = async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (cancelled) return;

        if (data.status === 'OK' && data.results?.[0]) {
          const { lat, lng } = data.results[0].geometry.location;
          setCoords({ lat, lng });
        } else {
          setGeocodeError(true);
        }
      } catch {
        if (!cancelled) setGeocodeError(true);
      }
    };

    geocode();
    return () => { cancelled = true; };
  }, [apiKey, location]);

  if (geocodeError) {
    return (
      <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center border">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Location not found</p>
        </div>
      </div>
    );
  }

  const markers: MapMarker[] = coords
    ? [{ id: 'item-location', lat: coords.lat, lng: coords.lng, title }]
    : [];

  return (
    <CapacitorAwareMap
      center={coords ?? { lat: 9.082, lng: 8.6753 }}
      zoom={13}
      markers={markers}
      height="160px"
      className="w-full rounded-lg border"
    />
  );
};
