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
import { getUserErrorMessage } from '@/utils/errorHandling';
import { MapPin, Navigation } from '@/lib/icons';
import { useNativePermissions } from '@/hooks/mobile/useNativePermissions';
import PermissionDeniedAlert from '@/components/mobile/PermissionDeniedAlert';
import { CapacitorAwareMap, MapCoords, MapMarker } from '@/components/maps/CapacitorAwareMap';
import { isNativePlatform } from '@/utils/platform';
import { useMapApiKey } from '@/hooks/useMapApiKey';

const getCapacitorPlatform = () => (window as any).Capacitor?.getPlatform?.() || 'web';

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationConfirm: (location: string, coords: { lat: number; lng: number }) => void;
}

const LocationPickerDialog = ({ open, onOpenChange, onLocationConfirm }: LocationPickerDialogProps) => {
  const isNative = isNativePlatform();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Getting your precise location...');

  // Native map state
  const [nativeCenter, setNativeCenter] = useState<MapCoords>({ lat: 9.082, lng: 8.6753 });
  const [nativeMarkers, setNativeMarkers] = useState<MapMarker[]>([]);

  // Web map refs (only used on web)
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const { getCurrentPosition } = useNativePermissions();
  const { apiKey } = useMapApiKey();

  const MAX_RETRIES = 3;

  // ─── Shared: reverse geocode via REST ────────────────────────────────────────

  const fallbackReverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('nigeria-reverse-geocode', {
        body: { latitude: lat, longitude: lng }
      });
      if (error) throw error;
      return data?.address || 'Current Location';
    } catch {
      return 'Current Location';
    }
  };

  const reverseGeocodeRest = async (coords: { lat: number; lng: number }): Promise<string> => {
    if (!apiKey) return fallbackReverseGeocode(coords.lat, coords.lng);
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) return data.results[0].formatted_address;
      return fallbackReverseGeocode(coords.lat, coords.lng);
    } catch {
      return fallbackReverseGeocode(coords.lat, coords.lng);
    }
  };

  // ─── Native map click → reverse geocode ──────────────────────────────────────

  const handleNativeMapClick = async (coords: MapCoords) => {
    setNativeCenter(coords);
    setNativeMarkers([{ id: 'pick', lat: coords.lat, lng: coords.lng, title: 'Selected location' }]);
    setIsLoading(true);
    const address = await reverseGeocodeRest(coords);
    setSelectedAddress(address);
    setSelectedCoords(coords);
    setIsLoading(false);
    toast({ title: 'Location updated', description: address });
  };

  // ─── Native: GPS only (no web map init) ──────────────────────────────────────

  const initializeNative = async () => {
    setIsLoading(true);
    setError(null);

    timeoutRef.current = setTimeout(() => {
      setLoadingMessage('Taking longer than expected... Try manual entry below');
      setManualEntryMode(true);
    }, 5000);

    try {
      const position = await Promise.race([
        getCurrentPosition(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Location request timed out')), 8000)
        ),
      ]);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      setNativeCenter(coords);
      setNativeMarkers([{ id: 'pick', lat: coords.lat, lng: coords.lng, title: 'Your location' }]);

      const address = await reverseGeocodeRest(coords);
      setSelectedAddress(address);
      setSelectedCoords(coords);
      setIsLoading(false);
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('permission')) {
        setPermissionDenied(true);
        setError('Location permission denied. Please enter your location manually below.');
      } else {
        setError('Unable to get your location. Please enter it manually below.');
      }
      setManualEntryMode(true);
      setIsLoading(false);
    }
  };

  // ─── Web: full Google Maps JS API (unchanged from original) ──────────────────

  const fetchApiKeyWithRetry = async (attempt = 0): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const authToken = session?.access_token ?? anonKey;

      const response = await fetch(`${supabaseUrl}/functions/v1/get-google-maps-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': anonKey,
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data?.token) throw new Error('No API key returned from server');
      setError(null);
      return data.token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        setRetryCount(attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchApiKeyWithRetry(attempt + 1);
      }
      throw new Error(`Failed to load map after ${MAX_RETRIES} attempts: ${errorMessage}`);
    }
  };

  const reverseGeocode = async (coords: { lat: number; lng: number }) => {
    if (!geocoderRef.current) {
      const address = await fallbackReverseGeocode(coords.lat, coords.lng).catch(
        () => `Location: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
      );
      setSelectedAddress(address);
      setSelectedCoords(coords);
      setIsLoading(false);
      return;
    }

    try {
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoderRef.current!.geocode({ location: coords }, (results, status) => {
          if (status === 'OK') resolve(results || []);
          else reject(new Error(`Geocoding failed: ${status}`));
        });
      });

      if (results?.length > 0) {
        setSelectedAddress(results[0].formatted_address);
        setSelectedCoords(coords);
        toast({ title: 'Location updated', description: 'Location has been selected successfully' });
      } else {
        const fallback = await fallbackReverseGeocode(coords.lat, coords.lng);
        setSelectedAddress(fallback);
        setSelectedCoords(coords);
      }
    } catch {
      const fallback = await fallbackReverseGeocode(coords.lat, coords.lng).catch(
        () => `Location: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
      );
      setSelectedAddress(fallback);
      setSelectedCoords(coords);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeWebMap = async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);

      const key = await fetchApiKeyWithRetry();

      if (!window.google?.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,marker&region=NG&language=en&loading=async`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = () => resolve(undefined);
          script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        });
      }

      setLoadingMessage('Requesting location permission...');
      timeoutRef.current = setTimeout(() => {
        setLoadingMessage('Taking longer than expected... Try manual entry below');
        setManualEntryMode(true);
      }, 5000);

      let position;
      try {
        position = await Promise.race([
          getCurrentPosition(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Location request timed out')), 8000)
          ),
        ]);
      } catch (locationError) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const { latitude, longitude } = position.coords;
      const initialLocation = { lat: latitude, lng: longitude };
      setLoadingMessage('Loading map...');

      await new Promise((resolve) => {
        if (window.google?.maps?.Map) { resolve(undefined); return; }
        const check = setInterval(() => {
          if (window.google?.maps?.Map) { clearInterval(check); resolve(undefined); }
        }, 100);
      });

      const map = new google.maps.Map(mapRef.current, {
        center: initialLocation,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        gestureHandling: 'cooperative',
        zoomControl: true,
        disableDefaultUI: false,
        mapId: 'LOCATION_PICKER_MAP',
        restriction: {
          latLngBounds: { north: 13.9, south: 4.3, east: 14.7, west: 2.7 },
          strictBounds: false,
        },
      });

      setTimeout(() => { google.maps.event.trigger(map, 'resize'); map.setCenter(initialLocation); }, 100);

      const geocoder = new google.maps.Geocoder();
      geocoderRef.current = geocoder;

      const pinElement = new google.maps.marker.PinElement({
        background: '#EA4335', borderColor: '#ffffff', glyphColor: '#ffffff', scale: 1.5,
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: initialLocation, map, gmpDraggable: true,
        content: pinElement.element, title: 'Drag to select exact location',
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      await reverseGeocode(initialLocation);

      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const newPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          marker.position = newPosition;
          reverseGeocode(newPosition);
        }
      });

      marker.addListener('dragend', () => {
        const position = marker.position as google.maps.LatLng | google.maps.LatLngLiteral | null;
        if (position) {
          const newPosition = {
            lat: typeof position.lat === 'function' ? position.lat() : position.lat,
            lng: typeof position.lng === 'function' ? position.lng() : position.lng,
          };
          reverseGeocode(newPosition);
        }
      });

      setIsLoading(false);
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, "Couldn't load the map. Please try again.");
      if (err instanceof Error && err.message.includes('permission')) {
        setPermissionDenied(true);
        setError('Location permission denied');
      } else {
        setError(errorMessage);
      }
      toast({ title: 'Map Loading Error', description: errorMessage, variant: 'destructive' });
      setManualEntryMode(true);
      setIsLoading(false);
    }
  };

  // ─── Dispatch ─────────────────────────────────────────────────────────────────

  const initializeMap = () => {
    if (isNative) initializeNative();
    else initializeWebMap();
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
      toast({ title: 'Address required', description: 'Please enter an address to search', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);

      if (!isNative && geocoderRef.current) {
        const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoderRef.current!.geocode(
            { address: manualAddress, componentRestrictions: { country: 'NG' }, region: 'ng' },
            (results, status) => {
              if (status === 'OK' && results) resolve(results);
              else reject(new Error(`Geocoding failed: ${status}`));
            }
          );
        });

        if (results?.length > 0) {
          const location = results[0].geometry.location;
          const coords = { lat: location.lat(), lng: location.lng() };
          setSelectedAddress(results[0].formatted_address);
          setSelectedCoords(coords);
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setCenter(coords);
            markerRef.current.position = coords;
          }
          toast({ title: 'Location found!', description: results[0].formatted_address });
        }
      } else {
        if (!apiKey) throw new Error('API key not available');
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(manualAddress)}&components=country:NG&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OK' && data.results?.[0]) {
          const { lat, lng } = data.results[0].geometry.location;
          const coords = { lat, lng };
          setSelectedAddress(data.results[0].formatted_address);
          setSelectedCoords(coords);
          setNativeCenter(coords);
          setNativeMarkers([{ id: 'pick', lat: coords.lat, lng: coords.lng, title: 'Selected location' }]);
          toast({ title: 'Location found!', description: data.results[0].formatted_address });
        } else {
          throw new Error('Location not found');
        }
      }
    } catch {
      toast({ title: 'Location not found', description: 'Please try a different address', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLocation = () => {
    onLocationConfirm('Nigeria', { lat: 9.082, lng: 8.6753 });
    onOpenChange(false);
    toast({ title: 'Location skipped', description: 'You can set your precise location later in settings' });
  };

  const handleConfirmLocation = () => {
    if (selectedAddress && selectedCoords) {
      onLocationConfirm(selectedAddress, selectedCoords);
      onOpenChange(false);
      toast({ title: 'Location confirmed!', description: 'Your selected location has been added.' });
    }
  };

  useEffect(() => {
    if (open && !mapInstanceRef.current) {
      setTimeout(() => initializeMap(), 300);
    }
    if (!open) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      mapInstanceRef.current = null;
      markerRef.current = null;
      geocoderRef.current = null;
      setSelectedAddress('');
      setSelectedCoords(null);
      setManualEntryMode(false);
      setManualAddress('');
      setLoadingMessage('Getting your precise location...');
      setNativeMarkers([]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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
          {permissionDenied && (
            <PermissionDeniedAlert permissionType="location" feature="location picker" />
          )}

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
                <Button variant="outline" size="sm" onClick={handleRetry} className="flex-1">
                  <Navigation className="h-3 w-3 mr-2" />
                  Try Auto-Detect Again
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSkipLocation} className="flex-1">
                  Skip for Now
                </Button>
              </div>
            </div>
          )}

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
                  <Button onClick={handleRetry} variant="default" size="sm">
                    <Navigation className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {isNative ? (
              <CapacitorAwareMap
                center={nativeCenter}
                zoom={15}
                markers={nativeMarkers}
                height="400px"
                className="w-full"
                onMapClick={handleNativeMapClick}
              />
            ) : (
              <div
                ref={mapRef}
                className="w-full h-full"
                style={{ minHeight: '400px', height: '100%', width: '100%' }}
              />
            )}
          </div>

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
            {isNative ? (
              <p>💡 Tap anywhere on the map to select your location</p>
            ) : (
              <>
                <p>💡 Click anywhere on the map or drag the red marker to adjust your location</p>
                <p>🎯 The marker shows your current position — move it to be more precise</p>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
