import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    // Get Mapbox token from edge function
    const getMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error getting Mapbox token:', error);
        // Fallback: Use a placeholder token for development
        setMapboxToken('pk.placeholder-token');
      }
    };

    getMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapboxToken === 'pk.placeholder-token') return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [3.3792, 6.5244], // Lagos, Nigeria coordinates
      zoom: 11,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Clean up on unmount
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add markers for each alert
    alerts.forEach((alert) => {
      if (!alert.latitude || !alert.longitude) return;

      const severityColors = {
        low: '#3B82F6',      // blue
        medium: '#F59E0B',   // yellow
        high: '#F97316',     // orange
        critical: '#EF4444'  // red
      };

      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'mapbox-marker';
      markerEl.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: ${severityColors[alert.severity]};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      `;

      // Add severity indicator
      markerEl.textContent = alert.severity === 'critical' ? '!' : 
                            alert.severity === 'high' ? '⚠' : 
                            alert.severity === 'medium' ? '!' : 'i';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3">
          <h3 class="font-semibold text-lg mb-2">${alert.title}</h3>
          <p class="text-sm text-muted-foreground mb-2">${alert.description}</p>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2 py-1 rounded" style="background-color: ${severityColors[alert.severity]}; color: white;">
              ${alert.severity.toUpperCase()}
            </span>
            <span class="text-xs text-muted-foreground">
              ${alert.alert_type.replace('_', ' ')}
            </span>
          </div>
          <p class="text-xs text-muted-foreground">${alert.address}</p>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([alert.longitude, alert.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click handler
      markerEl.addEventListener('click', () => {
        onAlertClick(alert);
      });
    });
  }, [alerts, onAlertClick]);

  if (!mapboxToken || mapboxToken === 'pk.placeholder-token') {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Map Not Available</h3>
          <p className="text-muted-foreground">
            Please configure your Mapbox token in Supabase Edge Function secrets
          </p>
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