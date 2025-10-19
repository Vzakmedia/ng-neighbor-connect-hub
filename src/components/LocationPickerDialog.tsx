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
import { MapPin, Navigation, Activity } from 'lucide-react';
import { useNativePermissions } from '@/hooks/mobile/useNativePermissions';
import PermissionDeniedAlert from '@/components/mobile/PermissionDeniedAlert';
import { LocationAccuracyIndicator } from '@/components/LocationAccuracyIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationConfirm: (location: string, coords: { lat: number; lng: number }) => void;
}

// Lagos neighborhood presets
const LAGOS_NEIGHBORHOODS = [
  { name: 'Ojota', coords: { lat: 6.5780, lng: 3.3767 } },
  { name: 'Ikeja', coords: { lat: 6.6018, lng: 3.3515 } },
  { name: 'Lekki', coords: { lat: 6.4474, lng: 3.5895 } },
  { name: 'Yaba', coords: { lat: 6.5095, lng: 3.3711 } },
  { name: 'Surulere', coords: { lat: 6.4969, lng: 3.3534 } },
  { name: 'Victoria Island', coords: { lat: 6.4281, lng: 3.4219 } },
  { name: 'Lagos Island', coords: { lat: 6.4541, lng: 3.3947 } },
  { name: 'Ikoyi', coords: { lat: 6.4543, lng: 3.4316 } },
  { name: 'Maryland', coords: { lat: 6.5703, lng: 3.3678 } },
  { name: 'Gbagada', coords: { lat: 6.5462, lng: 3.3835 } },
];

// Address cache for common Lagos locations
const LAGOS_LOCATION_CACHE: Record<string, string> = {
  '6.578_3.377': '137 Olatunji Street, Ojota, Lagos',
  '6.577_3.388': 'Ojota Bus Stop, Lagos',
  '6.602_3.352': 'Ikeja City Mall, Ikeja, Lagos',
  '6.447_3.590': 'Lekki Phase 1, Lagos',
};

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
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [isImprovingAccuracy, setIsImprovingAccuracy] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [debugInfo, setDebugInfo] = useState<{
    coords: { lat: number; lng: number } | null;
    accuracy: number | null;
    updates: number;
    method: string;
  }>({
    coords: null,
    accuracy: null,
    updates: 0,
    method: ''
  });
  const [showDebug, setShowDebug] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
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
      setLoadingMessage('Activating GPS... This may take 30-60 seconds.');

      // Set timeout to show manual entry option after 5 seconds
      timeoutRef.current = setTimeout(() => {
        setLoadingMessage('Taking longer than expected... Try manual entry below');
        setManualEntryMode(true);
      }, 5000);

      let position;
      try {
        // Get user's current position with real-time debug callback
        position = await getCurrentPosition(25, (pos) => {
          setDebugInfo({
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            accuracy: pos.coords.accuracy,
            updates: debugInfo.updates + 1,
            method: pos.coords.accuracy > 100 ? 'Cell Tower/IP' : 'GPS'
          });
        });
      } catch (locationError) {
        console.error('Location error:', locationError);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        const errorMsg = locationError instanceof Error ? locationError.message : 'Location error';
        
        if (errorMsg.includes('too poor') || errorMsg.includes('timeout')) {
          setError(`GPS signal too weak. ${errorMsg}\n\nTips:\n• Move outdoors or near a window\n• Ensure Location Services are enabled\n• Wait for clear sky view\n\nOr enter location manually below.`);
        } else if (errorMsg.includes('permission')) {
          setPermissionDenied(true);
          setError('Location permission denied. Please enter your location manually below.');
        } else if (errorMsg.includes('Invalid coordinates')) {
          setError('Invalid GPS data received. Please try again or enter location manually.');
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

      const { latitude, longitude, accuracy } = position.coords;
      
      // Validate coordinates
      if (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001) {
        setError('Invalid GPS coordinates (0,0). Please try again.');
        setManualEntryMode(true);
        setIsLoading(false);
        return;
      }

      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        setError('Invalid GPS data. Please enable location services.');
        setManualEntryMode(true);
        setIsLoading(false);
        return;
      }

      const initialLocation = { lat: latitude, lng: longitude };
      
      setLocationAccuracy(accuracy);
      console.log(`📍 Valid position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy}m)`);

      // Update loading message based on accuracy
      if (accuracy && accuracy > 100) {
        setLoadingMessage(`⚠️ GPS accuracy is poor (±${accuracy.toFixed(0)}m). Consider improving.`);
        setIsImprovingAccuracy(true);
        
        toast({
          title: "Poor GPS Accuracy",
          description: `Current accuracy: ±${accuracy.toFixed(0)}m. For better results, move outdoors or wait longer.`,
          variant: "destructive",
        });
      } else if (accuracy && accuracy <= 20) {
        setLoadingMessage('✅ High-precision location detected');
      } else if (accuracy && accuracy <= 50) {
        setLoadingMessage(`Location detected (±${accuracy.toFixed(0)}m). Initializing map...`);
      } else {
        setLoadingMessage(`Location acquired (±${accuracy.toFixed(0)}m). Consider improving for accuracy.`);
        setIsImprovingAccuracy(true);
      }

      // Update loading message based on accuracy
      if (accuracy && accuracy <= 20) {
        setLoadingMessage('✅ High-precision location detected');
      } else if (accuracy && accuracy <= 50) {
        setLoadingMessage(`Location detected (±${accuracy.toFixed(0)}m). Initializing map...`);
      } else {
        setLoadingMessage(`Location acquired (±${accuracy.toFixed(0)}m). Consider improving for accuracy.`);
        setIsImprovingAccuracy(true);
      }

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

      // Initialize map with higher zoom for better accuracy and Nigeria restrictions
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
        mapId: 'LOCATION_PICKER_MAP', // Required for AdvancedMarkerElement
        restriction: {
          latLngBounds: {
            north: 13.9,
            south: 4.3,
            east: 14.7,
            west: 2.7
          },
          strictBounds: false
        }
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

      // Create custom pin element
      const pinElement = new google.maps.marker.PinElement({
        background: '#EA4335',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.5,
      });

      // Create AdvancedMarkerElement with draggable capability
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: initialLocation,
        map: map,
        gmpDraggable: true,
        content: pinElement.element,
        title: 'Drag to select exact location',
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      console.log('Getting initial address...');
      // Get initial address with accuracy
      await reverseGeocode(initialLocation, accuracy);

      // Add click listener to map
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const newPosition = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          marker.position = newPosition;
          reverseGeocode(newPosition);
        }
      });

      // Add drag listener to marker using gmp-dragend event
      marker.addListener('dragend', () => {
        const position = marker.position as google.maps.LatLng | google.maps.LatLngLiteral | null;
        if (position) {
          const newPosition = {
            lat: typeof position.lat === 'function' ? position.lat() : position.lat,
            lng: typeof position.lng === 'function' ? position.lng() : position.lng
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
            markerRef.current.position = coords;
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

  const handleUseManualCoords = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive",
      });
      return;
    }

    const coords = { lat, lng };
    setSelectedCoords(coords);
    
    // Update map if it exists
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setCenter(coords);
      markerRef.current.position = coords;
    }

    // Try to get address
    await reverseGeocode(coords);
    
    toast({
      title: "Coordinates set",
      description: `Using ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  };

  const handleNeighborhoodSelect = async (neighborhoodName: string) => {
    const neighborhood = LAGOS_NEIGHBORHOODS.find(n => n.name === neighborhoodName);
    if (!neighborhood) return;

    const coords = neighborhood.coords;
    setSelectedCoords(coords);
    
    // Update map if it exists
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setCenter(coords);
      markerRef.current.position = coords;
    }

    // Try to get address
    await reverseGeocode(coords);
    
    toast({
      title: "Neighborhood selected",
      description: neighborhood.name,
    });
  };

  const getCachedAddress = (lat: number, lng: number): string | null => {
    const key = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
    return LAGOS_LOCATION_CACHE[key] || null;
  };

  const reverseGeocode = async (coords: { lat: number; lng: number }, accuracy?: number) => {
    // Validate coordinates before geocoding
    if (!coords || !coords.lat || !coords.lng) {
      console.warn('⚠️ Skipping reverse geocode: invalid coords', coords);
      return;
    }
    
    if (Math.abs(coords.lat) < 0.001 && Math.abs(coords.lng) < 0.001) {
      console.warn('⚠️ Skipping reverse geocode: (0,0) coordinates');
      return;
    }
    
    // Check cache first
    const cached = getCachedAddress(coords.lat, coords.lng);
    if (cached) {
      console.log('✅ Using cached address:', cached);
      setSelectedAddress(cached);
      setSelectedCoords(coords);
      return;
    }
    
    console.log('🗺️ Starting reverse geocoding for:', coords, `accuracy: ±${accuracy}m`);
    
    // First try Google Maps Geocoder (most accurate for Nigeria)
    if (geocoderRef.current) {
      try {
        const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoderRef.current!.geocode(
            { 
              location: coords,
              region: 'ng',
              language: 'en'
            },
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
          const bestResult = results.find(r => 
            r.types.includes('neighborhood') || 
            r.types.includes('sublocality') ||
            r.types.includes('route')
          ) || results[0];
          
          const address = bestResult.formatted_address;
          console.log('✅ Found address:', address);
          setSelectedAddress(address);
          setSelectedCoords(coords);
          
          // Only show toast for good accuracy
          if (accuracy && accuracy <= 50) {
            toast({
              title: accuracy <= 20 ? "Precise location detected" : "Location confirmed",
              description: address,
            });
          }
          
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.log('Google Geocoder failed, trying fallback...', error);
      }
    }

    // Fallback to Nigeria-specific edge function
    try {
      const fallbackAddress = await fallbackReverseGeocode(coords.lat, coords.lng);
      setSelectedAddress(fallbackAddress);
      setSelectedCoords(coords);
    } catch (fallbackError) {
      console.error('All geocoding methods failed:', fallbackError);
      setSelectedAddress(`Location: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      setSelectedCoords(coords);
    }
    
    setIsLoading(false);
  };

  const fallbackReverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      console.log('🗺️ [LocationPicker] Using Nigeria-specific reverse geocoding:', { lat, lng });
      
      // Use our Nigeria-specific reverse geocoding edge function
      const { data, error } = await supabase.functions.invoke('nigeria-reverse-geocode', {
        body: { latitude: lat, longitude: lng }
      });
      
      if (error) {
        console.error('❌ [LocationPicker] Edge function error:', error);
        throw error;
      }
      
      console.log('✅ [LocationPicker] Geocoding success:', data);
      return data?.address || "Current Location";
    } catch (error) {
      console.error('❌ [LocationPicker] Nigeria reverse geocoding failed:', error);
      return "Current Location";
    }
  };

  const improveLocationAccuracy = async () => {
    setIsImprovingAccuracy(true);
    setLoadingMessage('Waiting for better GPS signal...');
    
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude, accuracy } = position.coords;
      
      setLocationAccuracy(accuracy);
      
      if (accuracy && (!locationAccuracy || accuracy < locationAccuracy)) {
        const newLocation = { lat: latitude, lng: longitude };
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter(newLocation);
          markerRef.current.position = newLocation;
        }
        
        await reverseGeocode(newLocation, accuracy);
        
        toast({
          title: "Location improved!",
          description: `Accuracy improved to ±${accuracy.toFixed(0)}m`,
        });
      } else {
        toast({
          title: "GPS signal",
          description: "This is the best accuracy available in your current location",
        });
      }
    } catch (error) {
      toast({
        title: "Could not improve accuracy",
        description: "Try moving to an open area with clear sky view",
        variant: "destructive",
      });
    } finally {
      setIsImprovingAccuracy(false);
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
          
          {/* GPS Accuracy Indicator */}
          {locationAccuracy && (
            <LocationAccuracyIndicator 
              accuracy={locationAccuracy}
              onImprove={improveLocationAccuracy}
              isImproving={isImprovingAccuracy}
            />
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

              {/* Manual Coordinates Entry */}
              <div className="space-y-2">
                <Label>Or enter exact coordinates:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="Latitude (e.g., 6.5781131)"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                  />
                  <Input 
                    placeholder="Longitude (e.g., 3.3769411)"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                  />
                </div>
                <Button onClick={handleUseManualCoords} variant="secondary" size="sm" className="w-full">
                  Use These Coordinates
                </Button>
              </div>

              {/* Neighborhood Quick Select */}
              <div className="space-y-2">
                <Label>Or select your Lagos neighborhood:</Label>
                <Select onValueChange={handleNeighborhoodSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose neighborhood" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAGOS_NEIGHBORHOODS.map(n => (
                      <SelectItem key={n.name} value={n.name}>
                        {n.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* GPS Debug Panel */}
          {debugInfo.coords && (
            <Collapsible open={showDebug} onOpenChange={setShowDebug}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  {showDebug ? 'Hide' : 'Show'} GPS Debug Info
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Alert className="mt-2">
                  <AlertDescription>
                    <div className="font-mono text-xs space-y-1">
                      <div>📍 Lat: {debugInfo.coords.lat.toFixed(6)}</div>
                      <div>📍 Lng: {debugInfo.coords.lng.toFixed(6)}</div>
                      <div>📏 Accuracy: ±{debugInfo.accuracy}m</div>
                      <div>🔄 Updates: {debugInfo.updates}</div>
                      <div>🛰️ Method: {debugInfo.method}</div>
                      {debugInfo.method === 'Cell Tower/IP' && (
                        <div className="text-destructive mt-2">
                          ⚠️ Using cell tower/IP positioning. Move outdoors for GPS.
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </CollapsibleContent>
            </Collapsible>
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