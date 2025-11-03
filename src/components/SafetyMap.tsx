import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { NativeSafetyMap } from './mobile/NativeSafetyMap';

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
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Get Google Maps API key from edge function
    const getGoogleMapsApiKey = async () => {
      try {
        console.log('🗺️ [SafetyMap] Fetching Google Maps API key... Attempt:', retryCount + 1);
        setIsRetrying(true);
        
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
        
        console.log('🗺️ [SafetyMap] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('🗺️ [SafetyMap] Edge function response:', { 
          hasData: !!data, 
          hasToken: !!data?.token,
          error: data?.error
        });
        
        if (data.error) {
          console.error('❌ [SafetyMap] Error in response:', data.error);
          throw new Error(data.error);
        }
        
        if (!data.token) {
          console.error('❌ [SafetyMap] No token in response, data:', data);
          throw new Error('No API key in response');
        }
        
        console.log('✅ [SafetyMap] Successfully received API key, length:', data.token.length);
        setGoogleMapsApiKey(data.token);
        setError('');
        setIsRetrying(false);
      } catch (error: any) {
        console.error('❌ [SafetyMap] Error getting API key:', {
          message: error.message,
          stack: error.stack,
          retryCount
        });
        
        const errorMessage = error.message || 'Failed to load map configuration';
        setError(errorMessage);
        setIsRetrying(false);
        
        // Auto-retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          console.log(`🔄 [SafetyMap] Retrying in ${delay}ms... (${retryCount + 1}/3)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        }
      }
    };

    getGoogleMapsApiKey();
  }, [retryCount]);

  useEffect(() => {
    if (!mapContainer.current || !googleMapsApiKey) return;

    // Initialize Google Maps with marker library
    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
      libraries: ['places', 'marker']
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

      setMapLoaded(true);
    }).catch((error) => {
      console.error('Error loading Google Maps:', error);
    });
  }, [googleMapsApiKey]);

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

  if (error && retryCount >= 3) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center p-6 max-w-md">
          <div className="text-4xl mb-3">🗺️</div>
          <h3 className="text-lg font-semibold mb-2">Map Not Available</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setError('');
                setRetryCount(0);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            >
              Try Again
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

  if (!googleMapsApiKey || isRetrying) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">
            {isRetrying ? `Loading map... (Attempt ${retryCount + 1}/3)` : 'Loading map...'}
          </p>
          {error && retryCount < 3 && (
            <p className="text-xs text-muted-foreground mt-2">Retrying...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
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
      </div>

      {/* Alert count */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg">
        <div className="text-sm font-semibold">
          {alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default SafetyMap;