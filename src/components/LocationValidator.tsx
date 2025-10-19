import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { nigeriaLocationService } from '@/services/nigeriaLocationService';

interface LocationValidatorProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
}

export const LocationValidator: React.FC<LocationValidatorProps> = ({
  latitude,
  longitude,
  address
}) => {
  if (latitude === null || longitude === null) {
    return (
      <Alert className="border-yellow-500 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>No location detected.</strong> Please enable location services or enter your location manually.
        </AlertDescription>
      </Alert>
    );
  }

  const isInNigeria = nigeriaLocationService.isInNigeria(latitude, longitude);

  if (!isInNigeria) {
    return (
      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Location outside Nigeria.</strong> This app is designed for Nigerian locations only. 
          Please select a location within Nigeria or check your GPS settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-green-500 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800 flex items-start gap-2">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Location confirmed:</strong> {address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
        </div>
      </AlertDescription>
    </Alert>
  );
};
