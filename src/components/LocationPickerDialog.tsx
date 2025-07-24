import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Navigation } from 'lucide-react';

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationConfirm: (location: string, coords: { lat: number; lng: number }) => void;
}

const LocationPickerDialog = ({ open, onOpenChange, onLocationConfirm }: LocationPickerDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const { toast } = useToast();

  const initializeMap = async () => {
    if (!mapRef.current) {
      console.log('Map container not available');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting map initialization...');

      // Get Google Maps API key
      const { data: tokenData } = await supabase.functions.invoke('get-google-maps-token');
      
      if (!tokenData?.token) {
        throw new Error('Unable to get Maps API token');
      }

      console.log('Got Google Maps token, loading script...');

      // Load Google Maps API if not already loaded
      if (!window.google?.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${tokenData.token}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('Google Maps script loaded successfully');
            resolve(undefined);
          };
          script.onerror = (error) => {
            console.error('Failed to load Google Maps script:', error);
            reject(error);
          };
        });
      }

      console.log('Getting user location...');

      // Get user's current position with high accuracy
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('Got user location:', pos.coords.latitude, pos.coords.longitude);
            resolve(pos);
          },
          (error) => {
            console.error('Geolocation error:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const initialLocation = { lat: latitude, lng: longitude };

      console.log('Initializing map with location:', initialLocation);

      // Wait for Google Maps to be fully loaded
      await new Promise((resolve) => {
        if (window.google?.maps?.Map) {
          resolve(undefined);
        } else {
          const checkInterval = setInterval(() => {
            if (window.google?.maps?.Map) {
              clearInterval(checkInterval);
              resolve(undefined);
            }
          }, 100);
        }
      });

      // Initialize map with higher zoom for better accuracy
      const map = new google.maps.Map(mapRef.current, {
        center: initialLocation,
        zoom: 18,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        gestureHandling: 'cooperative',
        zoomControl: true,
        scaleControl: true,
        rotateControl: true,
      });

      console.log('Map created successfully');
      
      // Force map to resize - important for dialogs
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(initialLocation);
      }, 100);

      // Initialize geocoder
      const geocoder = new google.maps.Geocoder();
      geocoderRef.current = geocoder;

      // Create marker with better visibility
      const marker = new google.maps.Marker({
        position: initialLocation,
        map: map,
        draggable: true,
        title: 'Drag to select exact location',
        animation: google.maps.Animation.DROP,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });

      // Add accuracy circle if available
      if (position.coords.accuracy) {
        new google.maps.Circle({
          map: map,
          center: initialLocation,
          radius: position.coords.accuracy,
          fillColor: '#4285F4',
          fillOpacity: 0.1,
          strokeColor: '#4285F4',
          strokeOpacity: 0.3,
          strokeWeight: 1
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;

      console.log('Getting initial address...');
      // Get initial address
      await reverseGeocode(initialLocation);

      // Add click listener to map
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const newPosition = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          marker.setPosition(newPosition);
          reverseGeocode(newPosition);
        }
      });

      // Add drag listener to marker
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position) {
          const newPosition = {
            lat: position.lat(),
            lng: position.lng()
          };
          reverseGeocode(newPosition);
        }
      });

      console.log('Map initialization completed successfully');

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Map error",
        description: error instanceof Error ? error.message : "Unable to load the map. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (coords: { lat: number; lng: number }) => {
    if (!geocoderRef.current) return;

    try {
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { location: coords },
          (results, status) => {
            if (status === 'OK') {
              resolve(results || []);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      if (results && results.length > 0) {
        const address = results[0].formatted_address;
        setSelectedAddress(address);
        setSelectedCoords(coords);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setSelectedAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      setSelectedCoords(coords);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedAddress && selectedCoords) {
      onLocationConfirm(selectedAddress, selectedCoords);
      onOpenChange(false);
      toast({
        title: "Location confirmed!",
        description: "Your selected location has been added.",
      });
    }
  };

  useEffect(() => {
    if (open && !mapInstanceRef.current) {
      // Slight delay to ensure dialog is fully rendered
      setTimeout(() => {
        initializeMap();
      }, 300);
    }
    
    // Cleanup when dialog closes
    if (!open && mapInstanceRef.current) {
      mapInstanceRef.current = null;
      markerRef.current = null;
      geocoderRef.current = null;
      setSelectedAddress('');
      setSelectedCoords(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Your Location
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* Enhanced Location Controls */}
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => initializeMap()}
              disabled={isLoading}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Refresh GPS
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (mapInstanceRef.current && selectedCoords) {
                  mapInstanceRef.current.setZoom(20);
                  mapInstanceRef.current.setCenter(selectedCoords);
                }
              }}
            >
              🔍 Zoom In
            </Button>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative border rounded-lg overflow-hidden min-h-[400px]">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 animate-spin" />
                  <span>Getting precise location...</span>
                </div>
              </div>
            )}
            <div 
              ref={mapRef} 
              className="w-full h-full"
              style={{ 
                minHeight: '400px',
                height: '100%',
                width: '100%'
              }}
            />
          </div>

          {/* Selected Location Display */}
          {selectedAddress && (
            <div className="p-3 bg-muted rounded-lg flex-shrink-0">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Selected Location:</p>
                  <p className="text-sm text-muted-foreground">{selectedAddress}</p>
                  {selectedCoords && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Coordinates: {selectedCoords.lat.toFixed(7)}, {selectedCoords.lng.toFixed(7)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 flex-shrink-0">
            <p>💡 Click anywhere on the map or drag the red marker to select your exact location</p>
            <p>🔍 Use satellite view and zoom in for maximum precision</p>
            <p>📍 The blue circle shows your GPS accuracy range</p>
            <p>🎯 For best results, go outside and ensure GPS is enabled</p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmLocation}
            disabled={!selectedAddress || !selectedCoords}
            className="bg-gradient-primary hover:opacity-90"
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerDialog;