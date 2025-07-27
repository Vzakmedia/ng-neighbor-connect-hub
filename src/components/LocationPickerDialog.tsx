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

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationConfirm: (location: string) => void;
}

const LocationPickerDialog = ({ open, onOpenChange, onLocationConfirm }: LocationPickerDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const { toast } = useToast();
  // Simplified approach - just use a simple location input without Google Maps
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          setSelectedAddress(address);
          
          toast({
            title: "Success",
            description: "Current location detected successfully",
          });
        } catch (error) {
          console.error('Error getting location:', error);
          toast({
            title: "Error",
            description: "Failed to get location details",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let message = "Failed to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }

        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
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
      return data.display_name || data.locality || data.city || "Location detected";
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return "Current location";
    }
  };

  const handleConfirmLocation = () => {
    if (selectedAddress) {
      onLocationConfirm(selectedAddress);
      onOpenChange(false);
      toast({
        title: "Location confirmed!",
        description: "Your selected location has been added.",
      });
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectedAddress('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Your Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-location">Enter Location Manually</Label>
            <Input
              id="manual-location"
              placeholder="Type your location address..."
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Or</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isLoading ? "Getting location..." : "Use Current Location"}
            </Button>
          </div>

          {selectedAddress && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Selected Location:</p>
                  <p className="text-sm text-muted-foreground">{selectedAddress}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
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
            disabled={!selectedAddress}
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerDialog;