import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Get Google Maps API key from edge function
    const getGoogleMapsApiKey = async () => {
      try {
        console.log('Fetching Google Maps API key...');
        const { data, error } = await supabase.functions.invoke('get-google-maps-token');
        
        if (error) {
          console.error('Edge function error:', error);
          throw error;
        }
        
        if (!data || !data.token) {
          console.error('No token received from edge function');
          throw new Error('No API key returned');
        }
        
        console.log('Successfully received Google Maps API key');
        setGoogleMapsApiKey(data.token);
      } catch (error) {
        console.error('Error getting Google Maps API key:', error);
        setError('Unable to load map: API key not configured. Please add your Google Maps API key in Supabase secrets.');
      }
    };

    getGoogleMapsApiKey();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !googleMapsApiKey) return;

    // Initialize Google Maps
    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(async () => {
      if (!mapContainer.current) return;

      map.current = new (window as any).google.maps.Map(mapContainer.current, {
        center: { lat: 6.5244, lng: 3.3792 }, // Lagos, Nigeria coordinates
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      setMapLoaded(true);
    }).catch((error) => {
      console.error('Error loading Google Maps:', error);
    });
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null));
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

      // Create custom marker icon
      const markerIcon = {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: severityColors[alert.severity],
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      };

      // Create marker
      const marker = new (window as any).google.maps.Marker({
        position: { lat: alert.latitude, lng: alert.longitude },
        map: map.current,
        icon: markerIcon,
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

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center p-4">
          <h3 className="text-lg font-semibold mb-2">Map Not Available</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a 
            href="https://supabase.com/dashboard/project/cowiviqhrnmhttugozbz/settings/functions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm"
          >
            Configure API Key in Supabase →
          </a>
        </div>
      </div>
    );
  }

  if (!googleMapsApiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading map...</p>
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