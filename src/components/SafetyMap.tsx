import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Locate } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { NativeSafetyMap } from './mobile/NativeSafetyMap';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useGoogleMapsCache } from '@/hooks/useGoogleMapsCache';
import { LoadingSkeleton } from './community/feed/LoadingSkeleton';
import { LoadingSpinner } from './common/LoadingSpinner';

interface SafetyAlert {
  id: string;
  title: string;
  description: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'investigating' | 'false_alarm';
  latitude: number;
  longitude: number;
  address: string;
  images: string[];
  is_verified: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

interface SafetyMapProps {
  alerts: SafetyAlert[];
  onAlertClick: (alert: SafetyAlert) => void;
}

const SafetyMap: React.FC<SafetyMapProps> = ({ alerts, onAlertClick }) => {
  const isNative = Capacitor.isNativePlatform();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { apiKey: googleMapsApiKey, isLoading: isLoadingApiKey, error: apiKeyError, geocodeAddress } = useGoogleMapsCache();
  
  
  // Use native map on mobile, web map otherwise
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
        center={{ lat: 9.082, lng: 8.6753 }}
        zoom={12}
        markers={nativeMarkers}
        onMarkerClick={(markerId) => {
          const alert = alerts.find(a => a.id === markerId);
          if (alert) onAlertClick(alert);
        }}
      />
    );
  }

  // Web map implementation below
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const userMarker = useRef<any>(null);
  const coverageCircle = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !googleMapsApiKey) return;

    // Initialize Google Maps with only marker library (lazy load others)
    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
      libraries: ['marker'] // Only load marker library initially
    });

    loader.load().then(async () => {
      if (!mapContainer.current) return;

      map.current = new (window as any).google.maps.Map(mapContainer.current, {
        center: { lat: 9.0820, lng: 8.6753 }, // Nigeria center coordinates
        zoom: 6, // Show all of Nigeria
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        mapId: 'SAFETY_MAP', // Required for AdvancedMarkerElement
        restriction: {
          latLngBounds: {
            north: 13.9,  // Northern Nigeria border
            south: 4.3,   // Southern Nigeria border
            east: 14.7,   // Eastern Nigeria border
            west: 2.7     // Western Nigeria border
          },
          strictBounds: false
        }
      });

      // Get user's profile address and zoom to it, fallback to current location
      const zoomToUserLocation = async () => {
        let locationFound = false;

        // Try to use profile address first with caching
        if (profile?.neighborhood || profile?.city || profile?.state) {
          const addressParts = [
            profile.neighborhood,
            profile.city,
            profile.state,
            'Nigeria'
          ].filter(Boolean);
          
          const fullAddress = addressParts.join(', ');
          
          // Use cached geocoding
          const location = await geocodeAddress(fullAddress);
          
          if (location) {
            setUserLocation(location);
              map.current?.setCenter(location);
              map.current?.setZoom(14);
              
              // Add a marker for user's location
              userMarker.current = new (window as any).google.maps.marker.AdvancedMarkerElement({
                position: location,
                map: map.current,
                title: 'Your Location',
                content: new (window as any).google.maps.marker.PinElement({
                  background: '#10B981', // green
                  borderColor: '#ffffff',
                  glyphColor: '#ffffff',
                  scale: 1.3,
                }).element,
              });

              // Add coverage radius circle (5km radius for neighborhood)
              coverageCircle.current = new (window as any).google.maps.Circle({
                strokeColor: '#10B981',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#10B981',
                fillOpacity: 0.15,
                map: map.current,
                center: location,
                radius: 5000, // 5km radius
              });
            
            locationFound = true;
          }
        }

        // Fallback to geolocation if address not available or geocoding failed
        if (!locationFound && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              
              setUserLocation(location);
              
              // Pan and zoom to user's location
              map.current?.setCenter(location);
              map.current?.setZoom(14);
              
              // Add a marker for user's location
              userMarker.current = new (window as any).google.maps.marker.AdvancedMarkerElement({
                position: location,
                map: map.current,
                title: 'Your Current Location',
                content: new (window as any).google.maps.marker.PinElement({
                  background: '#10B981', // green
                  borderColor: '#ffffff',
                  glyphColor: '#ffffff',
                  scale: 1.3,
                }).element,
              });

              // Add coverage radius circle (5km radius for neighborhood)
              coverageCircle.current = new (window as any).google.maps.Circle({
                strokeColor: '#10B981',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#10B981',
                fillOpacity: 0.15,
                map: map.current,
                center: location,
                radius: 5000, // 5km radius
              });
            },
            (error) => {
              console.log('Geolocation error:', error.message);
              // Stay with default Nigeria center if both methods fail
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
        }
      };

      zoomToUserLocation();

      setMapLoaded(true);
    }).catch((error) => {
      console.error('Error loading Google Maps:', error);
    });
  }, [googleMapsApiKey, profile]);

  // Function to recenter map to user's location
  const recenterToUserLocation = async () => {
    if (!map.current) return;

    let locationFound = false;

    // Try to use profile address first with caching
    if (profile?.neighborhood || profile?.city || profile?.state) {
      const addressParts = [
        profile.neighborhood,
        profile.city,
        profile.state,
        'Nigeria'
      ].filter(Boolean);
      
      const fullAddress = addressParts.join(', ');
      
      // Use cached geocoding
      const location = await geocodeAddress(fullAddress);
      
      if (location) {
        setUserLocation(location);
          map.current.setCenter(location);
          map.current.setZoom(14);
          
          // Update marker and circle
          if (userMarker.current) {
            userMarker.current.position = location;
          }
          if (coverageCircle.current) {
            coverageCircle.current.setCenter(location);
          }
        
        locationFound = true;
        return;
      }
    }

    // Fallback to geolocation
    if (!locationFound && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setUserLocation(location);
          map.current?.setCenter(location);
          map.current?.setZoom(14);
          
          // Update marker and circle if they don't exist
          if (!userMarker.current) {
            userMarker.current = new (window as any).google.maps.marker.AdvancedMarkerElement({
              position: location,
              map: map.current,
              title: 'Your Current Location',
              content: new (window as any).google.maps.marker.PinElement({
                background: '#10B981',
                borderColor: '#ffffff',
                glyphColor: '#ffffff',
                scale: 1.3,
              }).element,
            });
          } else {
            userMarker.current.position = location;
          }

          if (!coverageCircle.current) {
            coverageCircle.current = new (window as any).google.maps.Circle({
              strokeColor: '#10B981',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#10B981',
              fillOpacity: 0.15,
              map: map.current,
              center: location,
              radius: 5000,
            });
          } else {
            coverageCircle.current.setCenter(location);
          }
        },
        (error) => {
          console.error('Error getting location:', error.message);
        }
      );
    }
  };

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.map = null);
    markers.current = [];

    // Add markers for each alert
    alerts.forEach((alert) => {
      if (!alert.latitude || !alert.longitude) return;

      const severityColors = {
        low: '#3B82F6',      // blue
        medium: '#F59E0B',   // yellow
        high: '#F97316',     // orange
        critical: '#EF4444'  // red
      };

      // Create custom marker content using PinElement
      const pinElement = new (window as any).google.maps.marker.PinElement({
        background: severityColors[alert.severity],
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.2,
      });

      // Create AdvancedMarkerElement
      const marker = new (window as any).google.maps.marker.AdvancedMarkerElement({
        position: { lat: alert.latitude, lng: alert.longitude },
        map: map.current,
        content: pinElement.element,
        title: alert.title,
      });

      // Create info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 300px;">
            <h3 style="font-weight: 600; font-size: 18px; margin-bottom: 8px;">${alert.title}</h3>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">${alert.description}</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="background-color: ${severityColors[alert.severity]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                ${alert.severity.toUpperCase()}
              </span>
              <span style="color: #6b7280; font-size: 12px;">
                ${alert.alert_type.replace('_', ' ')}
              </span>
            </div>
            <p style="color: #6b7280; font-size: 12px;">${alert.address}</p>
          </div>
        `
      });

      // Add click listeners
      marker.addListener('click', () => {
        infoWindow.open(map.current, marker);
        onAlertClick(alert);
      });

      markers.current.push(marker);
    });
  }, [alerts, onAlertClick, mapLoaded]);

  if (apiKeyError) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center p-6 max-w-md">
          <div className="text-4xl mb-3">🗺️</div>
          <h3 className="text-lg font-semibold mb-2">Map Not Available</h3>
          <p className="text-sm text-muted-foreground mb-4">{apiKeyError}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            >
              Reload Page
            </button>
            <div>
              <a 
                href="https://supabase.com/dashboard/project/cowiviqhrnmhttugozbz/settings/functions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm block"
              >
                Configure API Key in Supabase →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingApiKey || !googleMapsApiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading map..." />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Recenter Button - Positioned below the action buttons */}
      <div className="absolute top-28 right-4 z-20">
        <Button
          size="icon"
          onClick={recenterToUserLocation}
          className="rounded-full shadow-lg bg-background hover:bg-accent text-foreground border border-border"
          title="Recenter to my location"
        >
          <Locate className="h-5 w-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background p-3 rounded-lg shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Alert Severity</h4>
        <div className="space-y-1">
          {[
            { severity: 'critical', color: '#EF4444', label: 'Critical' },
            { severity: 'high', color: '#F97316', label: 'High' },
            { severity: 'medium', color: '#F59E0B', label: 'Medium' },
            { severity: 'low', color: '#3B82F6', label: 'Low' }
          ].map(({ severity, color, label }) => (
            <div key={severity} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
        {userLocation && (
          <>
            <div className="border-t border-border mt-2 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 border border-white" />
                <span className="text-xs">Your Location</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-500/15" />
                <span className="text-xs">Coverage Area (5km)</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Alert count */}
      <div className="absolute top-4 left-4 bg-background p-2 rounded-lg shadow-lg">
        <div className="text-sm font-semibold">
          {alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default SafetyMap;