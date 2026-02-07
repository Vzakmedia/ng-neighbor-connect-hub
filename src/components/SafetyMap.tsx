import React, { useEffect } from 'react';
import { LoadingSpinner } from './common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { NativeSafetyMap } from './mobile/NativeSafetyMap';
import { SafetyMapOverlay } from './emergency/SafetyMapOverlay';
import { useGoogleMapsCache } from '@/hooks/useGoogleMapsCache';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useWebSafetyMap } from '@/hooks/useWebSafetyMap';
import {
  isNativePlatform,
  SafetyAlert,
  USER_LOCATION_ZOOM,
  DEFAULT_CENTER,
  DEFAULT_ZOOM
} from '@/utils/map-utils';

interface SafetyMapProps {
  alerts: SafetyAlert[];
  onAlertClick: (alert: SafetyAlert) => void;
}

const SafetyMap: React.FC<SafetyMapProps> = ({ alerts, onAlertClick }) => {
  const isNative = isNativePlatform();
  const { apiKey: googleMapsApiKey, isLoading: isLoadingApiKey, error: apiKeyError, getPlaceId } = useGoogleMapsCache();
  const { userLocation, refreshLocation } = useUserLocation();
  const {
    mapContainer,
    mapLoaded,
    initMap,
    updateMarkers,
    updateUserMarker,
    setMapCenter,
    setNeighborhoodStyle
  } = useWebSafetyMap({ apiKey: googleMapsApiKey, onAlertClick });

  // Native map rendering
  if (isNative) {
    const nativeMarkers = alerts.map(alert => ({
      id: alert.id,
      latitude: alert.latitude,
      longitude: alert.longitude,
      title: alert.title,
      snippet: alert.description,
      type: 'alert' as const,
    }));

    return (
      <NativeSafetyMap
        center={userLocation || DEFAULT_CENTER}
        zoom={userLocation ? USER_LOCATION_ZOOM : DEFAULT_ZOOM}
        markers={nativeMarkers}
        onMarkerClick={(markerId) => {
          const alert = alerts.find(a => a.id === markerId);
          if (alert) onAlertClick(alert);
        }}
      />
    );
  }

  // Web map initialization
  useEffect(() => {
    if (googleMapsApiKey) {
      initMap();
    }
  }, [googleMapsApiKey, initMap]);

  // Handle markers update
  useEffect(() => {
    if (mapLoaded) {
      updateMarkers(alerts);
    }
  }, [alerts, mapLoaded, updateMarkers]);

  // Handle user location and neighborhood boundary
  useEffect(() => {
    if (!mapLoaded || !userLocation) return;

    updateUserMarker(userLocation);
    setMapCenter(userLocation, USER_LOCATION_ZOOM);

    // Try to show neighborhood boundary
    const loadNeighborhood = async () => {
      // Note: In a real app, we might need a more specific address for Place ID
      // This is a simplified version of the original logic
      try {
        const placeId = await getPlaceId('Nigeria'); // Fallback or use more specific address if available
        if (placeId) {
          setNeighborhoodStyle(placeId);
        }
      } catch (error) {
        console.log('⚠️ Neighborhood boundary not available');
      }
    };

    loadNeighborhood();
  }, [userLocation, mapLoaded, updateUserMarker, setMapCenter, getPlaceId, setNeighborhoodStyle]);

  if (apiKeyError) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center p-6 max-w-md">
          <div className="text-4xl mb-3">🗺️</div>
          <h3 className="text-lg font-semibold mb-2">Map Not Available</h3>
          <p className="text-sm text-muted-foreground mb-4">{apiKeyError}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  if (isLoadingApiKey || !googleMapsApiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <LoadingSpinner size="lg" text="Loading map..." />
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-screen w-full">
      <div ref={mapContainer} className="absolute inset-0" />

      <SafetyMapOverlay
        alertCount={alerts.length}
        onRecenter={refreshLocation}
        showUserLegend={!!userLocation}
      />
    </div>
  );
};

export default SafetyMap;