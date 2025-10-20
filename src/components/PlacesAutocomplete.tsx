import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navigation, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNativePermissions } from '@/hooks/mobile/useNativePermissions';

interface PlacesAutocompleteProps {
  onLocationSelect: (location: string, coords: { lat: number; lng: number }) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

const PlacesAutocomplete = ({
  onLocationSelect,
  placeholder = "Search for a place in Nigeria...",
  defaultValue = "",
  className = ""
}: PlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const { getCurrentPosition, requestLocationPermission } = useNativePermissions();

  useEffect(() => {
    if (!inputRef.current) return;

    const initializeAutocomplete = async () => {
      try {
        // Get Google Maps API key
        const { data, error: apiError } = await supabase.functions.invoke('get-google-maps-token');
        
        if (apiError) throw new Error('Failed to load map services');
        
        const apiKey = data?.token;
        if (!apiKey) throw new Error('Map services unavailable');

        // Load Google Maps script if not already loaded
        if (!window.google?.maps) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&region=NG&language=en`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
          });
        }

        // Initialize autocomplete
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current!, {
          componentRestrictions: { country: 'ng' },
          fields: ['address_components', 'geometry', 'formatted_address', 'name'],
          types: ['geocode', 'establishment']
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          
          if (place?.geometry?.location) {
            const coords = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            const address = place.formatted_address || place.name || '';
            onLocationSelect(address, coords);
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing autocomplete:', err);
        setError('Unable to load location services. You can still enter location manually.');
        setIsLoading(false);
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onLocationSelect]);

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        toast({
          title: "Permission required",
          description: "Please enable location access to use this feature",
          variant: "destructive",
        });
        return;
      }

      const position = await getCurrentPosition();
      
      // Reverse geocode to get address
      if (window.google?.maps) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          {
            location: { 
              lat: position.coords.latitude, 
              lng: position.coords.longitude 
            },
            region: 'ng'
          },
          (results, status) => {
            if (status === 'OK' && results?.[0]) {
              onLocationSelect(
                results[0].formatted_address,
                { 
                  lat: position.coords.latitude, 
                  lng: position.coords.longitude 
                }
              );
              if (inputRef.current) {
                inputRef.current.value = results[0].formatted_address;
              }
            } else {
              toast({
                title: "Error",
                description: "Could not determine address from your location",
                variant: "destructive",
              });
            }
          }
        );
      }
    } catch (err) {
      console.error('Error getting location:', err);
      toast({
        title: "Error",
        description: "Failed to get your current location",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            defaultValue={defaultValue}
            disabled={isLoading}
            className={className}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation || isLoading}
          title="Use my current location"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-muted-foreground">{error}</p>
      )}
    </div>
  );
};

export default PlacesAutocomplete;
