import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useNativePermissions } from '@/hooks/mobile/useNativePermissions';
import PermissionDeniedAlert from '@/components/mobile/PermissionDeniedAlert';

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationConfirm: (location: string, coords: { lat: number; lng: number }) => void;
}

const LocationPickerDialog = ({ open, onOpenChange, onLocationConfirm }: LocationPickerDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Getting your precise location...');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { getCurrentPosition } = useNativePermissions();
  
  const MAX_RETRIES = 3;
  const fetchApiKeyWithRetry = async (attempt = 0): Promise<string> => {
    console.log(`🔑 [LocationPicker] Fetching API key (attempt ${attempt + 1}/${MAX_RETRIES})...`);
    
    try {
      const response = await fetch(
        'https://cowiviqhrnmhttugozbz.supabase.co/functions/v1/get-google-maps-token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd2l2aXFocm5taHR0dWdvemJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTQ0NDQsImV4cCI6MjA2ODYzMDQ0NH0.BJ6OstIOar6CqEv__WzF9qZYaW12uQ-FfXYaVdxgJM4`,
          },
        }
      );
      
      console.log('🔑 [LocationPicker] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('🔑 [LocationPicker] Edge function response:', { 
        hasData: !!data, 
        hasToken: !!data?.token,
        error: data?.error 
      });

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data?.token) {
        throw new Error('No API key returned from server');
      }

      console.log('✅ [LocationPicker] API key retrieved successfully');
      setError(null);
      return data.token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ [LocationPicker] Attempt ${attempt + 1} failed:`, errorMessage);

      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ [LocationPicker] Retrying in ${delay}ms...`);
        setRetryCount(attempt + 1);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchApiKeyWithRetry(attempt + 1);
      } else {
        throw new Error(`Failed to load map after ${MAX_RETRIES} attempts: ${errorMessage}`);
      }
    }
  };

  const initializeMap = async () => {
    if (!mapRef.current) {
      console.log('Map container not available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
      console.log('Starting map initialization...');

      // Get Google Maps API key with retry logic
      const apiKey = await fetchApiKeyWithRetry();
      console.log('Got Google Maps token, loading script...');

      // Load Google Maps API if not already loaded
      if (!window.google?.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
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
            reject(new Error('Failed to load Google Maps script'));
          };
        });
      }

      console.log('Requesting location permission...');
      setLoadingMessage('Requesting location permission...');

      // Set timeout to show manual entry option after 10 seconds
      timeoutRef.current = setTimeout(() => {
        setLoadingMessage('Taking longer than expected... Try manual entry below');
        setManualEntryMode(true);
      }, 10000);

      let position;
      try {
        // Get user's current position with timeout handling
        position = await Promise.race([
          getCurrentPosition(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Location request timed out')), 20000)
          )
        ]);
      } catch (locationError) {
        console.error('Location error:', locationError);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        const errorMsg = locationError instanceof Error ? locationError.message : 'Location error';
        
        if (errorMsg.includes('permission')) {
          setPermissionDenied(true);
          setError('Location permission denied. Please enter your location manually below.');
        } else {
          setError('Unable to get your location. Please enter it manually below.');
        }
        
        setManualEntryMode(true);
        setIsLoading(false);
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const { latitude, longitude } = position.coords;
      const initialLocation = { lat: latitude, lng: longitude };

      console.log('Initializing map with location:', initialLocation);
      setLoadingMessage('Loading map...');

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
        zoom: 16,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });

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
      setIsLoading(false); // Show map immediately after initialization

    } catch (error) {
      console.error('❌ [LocationPicker] Error initializing map:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check if it's a permission error
      if (error instanceof Error && error.message.includes('permission')) {
        setPermissionDenied(true);
        setError('Location permission denied');
      } else {
        setError(errorMessage);
      }
      
      toast({
        title: "Map Loading Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setManualEntryMode(false);
    setPermissionDenied(false);
    initializeMap();
  };

  const handleManualAddressSearch = async () => {
    if (!manualAddress.trim()) {
      toast({
        title: "Address required",
        description: "Please enter an address to search",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Use Google Maps Geocoding API if available
      if (geocoderRef.current) {
        const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoderRef.current!.geocode(
            { address: manualAddress },
            (results, status) => {
              if (status === 'OK' && results) {
                resolve(results);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            }
          );
        });

        if (results && results.length > 0) {
          const location = results[0].geometry.location;
          const coords = { lat: location.lat(), lng: location.lng() };
          
          setSelectedAddress(results[0].formatted_address);
          setSelectedCoords(coords);
          
          // Update map if it exists
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setCenter(coords);
            markerRef.current.setPosition(coords);
          }
          
          toast({
            title: "Location found!",
            description: results[0].formatted_address,
          });
        }
      }
    } catch (error) {
      console.error('Manual geocoding error:', error);
      toast({
        title: "Location not found",
        description: "Please try a different address or be more specific",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLocation = () => {
    // Use a default location (e.g., center of Nigeria)
    const defaultCoords = { lat: 9.0820, lng: 8.6753 };
    onLocationConfirm("Nigeria", defaultCoords);
    onOpenChange(false);
    toast({
      title: "Location skipped",
      description: "You can set your precise location later in settings",
    });
  };

  const reverseGeocode = async (coords: { lat: number; lng: number }) => {
    console.log('Starting reverse geocoding for:', coords);
    
    if (!geocoderRef.current) {
      console.log('Geocoder not available, using fallback');
      try {
        const address = await fallbackReverseGeocode(coords.lat, coords.lng);
        setSelectedAddress(address);
        setSelectedCoords(coords);
      } catch (error) {
        setSelectedAddress(`Location: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        setSelectedCoords(coords);
      }
      setIsLoading(false);
      return;
    }

    try {
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { location: coords },
          (results, status) => {
            console.log('Geocoding status:', status);
            
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
        console.log('Found address:', address);
        setSelectedAddress(address);
        setSelectedCoords(coords);
        
        toast({
          title: "Location updated",
          description: "Location has been selected successfully",
        });
      } else {
        const fallbackAddress = await fallbackReverseGeocode(coords.lat, coords.lng);
        setSelectedAddress(fallbackAddress);
        setSelectedCoords(coords);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      try {
        const fallbackAddress = await fallbackReverseGeocode(coords.lat, coords.lng);
        setSelectedAddress(fallbackAddress);
        setSelectedCoords(coords);
      } catch (fallbackError) {
        setSelectedAddress(`Location: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        setSelectedCoords(coords);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackReverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.display_name || data.locality || data.city || "Current Location";
    } catch (error) {
      console.error('Fallback reverse geocoding failed:', error);
      return "Current Location";
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
    if (!open) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
      geocoderRef.current = null;
      setSelectedAddress('');
      setSelectedCoords(null);
      setManualEntryMode(false);
      setManualAddress('');
      setLoadingMessage('Getting your precise location...');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Confirm Your Location
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* Permission Denied Alert */}
          {permissionDenied && (
            <PermissionDeniedAlert permissionType="location" feature="location picker" />
          )}
          
          {/* Manual Entry Mode */}
          {manualEntryMode && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="manual-address">Enter Your Location Manually</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-address"
                    placeholder="Enter address, city, or landmark..."
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualAddressSearch()}
                  />
                  <Button onClick={handleManualAddressSearch} disabled={isLoading}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="flex-1"
                >
                  <Navigation className="h-3 w-3 mr-2" />
                  Try Auto-Detect Again
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipLocation}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="flex-1 relative border rounded-lg overflow-hidden min-h-[400px]">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 animate-spin" />
                    <span>{loadingMessage}</span>
                  </div>
                  {retryCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Retrying... (Attempt {retryCount + 1} of {MAX_RETRIES})
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {error && !isLoading && (
              <div className="absolute inset-0 bg-background flex items-center justify-center z-10 p-4">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-destructive">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <h3 className="font-semibold text-lg">Map Loading Failed</h3>
                    <p className="text-sm mt-2">{error}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleRetry} variant="default" size="sm">
                      <Navigation className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://supabase.com/dashboard/project/cowiviqhrnmhttugozbz/settings/functions', '_blank')}
                    >
                      Configure API Key
                    </Button>
                  </div>
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
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 flex-shrink-0">
            <p>💡 Click anywhere on the map or drag the red marker to adjust your location</p>
            <p>🎯 The marker shows your current position - move it to be more precise</p>
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
          >
            Confirm This Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerDialog;