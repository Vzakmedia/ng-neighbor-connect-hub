import { useRef, useCallback, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import {
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
    NIGERIA_BOUNDS,
    SEVERITY_COLORS,
    SafetyAlert,
    MapLocation
} from '@/utils/map-utils';

interface UseWebSafetyMapProps {
    apiKey: string;
    onAlertClick: (alert: SafetyAlert) => void;
}

export const useWebSafetyMap = ({ apiKey, onAlertClick }: UseWebSafetyMapProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<any>(null);
    const markers = useRef<any[]>([]);
    const userMarker = useRef<any>(null);
    const neighborhoodFeatureLayer = useRef<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const initMap = useCallback(async () => {
        if (!mapContainer.current || !apiKey) return;

        const loader = new Loader({
            apiKey,
            version: 'weekly',
            libraries: ['marker', 'places']
        });

        try {
            await loader.load();
            if (!mapContainer.current) return;

            map.current = new (window as any).google.maps.Map(mapContainer.current, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                zoomControl: true,
                mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'SAFETY_MAP',
                restriction: {
                    latLngBounds: NIGERIA_BOUNDS,
                    strictBounds: false
                }
            });

            setMapLoaded(true);
        } catch (error) {
            console.error('Error loading Google Maps:', error);
        }
    }, [apiKey]);

    const updateMarkers = useCallback((alerts: SafetyAlert[]) => {
        if (!map.current || !mapLoaded) return;

        // Clear existing markers
        markers.current.forEach(marker => marker.map = null);
        markers.current = [];

        alerts.forEach((alert) => {
            if (!alert.latitude || !alert.longitude) return;

            const pinElement = new (window as any).google.maps.marker.PinElement({
                background: SEVERITY_COLORS[alert.severity],
                borderColor: '#ffffff',
                glyphColor: '#ffffff',
                scale: 1.2,
            });

            const marker = new (window as any).google.maps.marker.AdvancedMarkerElement({
                position: { lat: alert.latitude, lng: alert.longitude },
                map: map.current,
                content: pinElement.element,
                title: alert.title,
            });

            const infoWindow = new (window as any).google.maps.InfoWindow({
                content: `
          <div style="padding: 12px; max-width: 300px;">
            <h3 style="font-weight: 600; font-size: 18px; margin-bottom: 8px;">${alert.title}</h3>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">${alert.description}</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="background-color: ${SEVERITY_COLORS[alert.severity]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
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

            marker.addListener('gmp-click', () => {
                infoWindow.open(map.current, marker);
                onAlertClick(alert);
            });

            markers.current.push(marker);
        });
    }, [mapLoaded, onAlertClick]);

    const updateUserMarker = useCallback((location: MapLocation, isCurrent: boolean = false) => {
        if (!map.current || !mapLoaded) return;

        if (userMarker.current) {
            userMarker.current.position = location;
        } else {
            const homeIconDiv = document.createElement('div');
            homeIconDiv.innerHTML = `
        <div style="
          background: #10B981;
          border: 3px solid #ffffff;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      `;

            userMarker.current = new (window as any).google.maps.marker.AdvancedMarkerElement({
                position: location,
                map: map.current,
                title: isCurrent ? 'Your Current Location' : 'Your Home',
                content: homeIconDiv,
            });
        }
    }, [mapLoaded]);

    const setMapCenter = useCallback((location: MapLocation, zoom?: number) => {
        if (map.current) {
            map.current.setCenter(location);
            if (zoom !== undefined) {
                map.current.setZoom(zoom);
            }
        }
    }, []);

    const setNeighborhoodStyle = useCallback((placeId: string) => {
        if (map.current?.getFeatureLayer) {
            const featureLayer = map.current.getFeatureLayer('LOCALITY');
            if (featureLayer) {
                neighborhoodFeatureLayer.current = featureLayer;
                featureLayer.style = (options: any) => {
                    if (options.feature.placeId === placeId) {
                        return {
                            strokeColor: '#10B981',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: '#10B981',
                            fillOpacity: 0.15,
                        };
                    }
                    return null;
                };
            }
        }
    }, []);

    return {
        mapContainer,
        mapLoaded,
        initMap,
        updateMarkers,
        updateUserMarker,
        setMapCenter,
        setNeighborhoodStyle
    };
};
