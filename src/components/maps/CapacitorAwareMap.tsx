import { useEffect, useRef, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMapApiKey } from '@/hooks/useMapApiKey';
import { isNativePlatform } from '@/utils/platform';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  snippet?: string;
  iconUrl?: string;
}

export interface MapCoords {
  lat: number;
  lng: number;
}

interface CapacitorAwareMapProps {
  center: MapCoords;
  zoom?: number;
  markers?: MapMarker[];
  height?: string;
  className?: string;
  onMapClick?: (coords: MapCoords) => void;
  onMarkerClick?: (markerId: string) => void;
}

// ─── Native implementation (iOS / Android) ───────────────────────────────────

const NativeMapView = ({
  center,
  zoom = 14,
  markers = [],
  height = '100%',
  className = '',
  onMapClick,
  onMarkerClick,
}: CapacitorAwareMapProps) => {
  const { apiKey, loading: keyLoading, error: keyError } = useMapApiKey();
  const mapRef = useRef<HTMLElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapIdRef = useRef('cap-map-' + Math.random().toString(36).slice(2, 9));
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  // Initialise map once API key is ready
  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    let destroyed = false;

    const init = async () => {
      try {
        setIsLoading(true);

        // Wait for the element to have non-zero pixel size before handing
        // it to GoogleMap.create() — the plugin uses getBoundingClientRect()
        // to position the native view; a 0×0 element produces an invisible map.
        const el = mapRef.current!;
        await new Promise<void>((resolve) => {
          const check = () => {
            if (el.offsetWidth > 0 && el.offsetHeight > 0) resolve();
            else requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        });

        if (destroyed) return;

        const { GoogleMap } = await import('@capacitor/google-maps');

        const map = await GoogleMap.create({
          id: mapIdRef.current,
          element: el,
          apiKey,
          config: { center, zoom },
        });

        if (onMarkerClickRef.current) {
          await map.setOnMarkerClickListener((e) => {
            onMarkerClickRef.current?.(e.markerId);
          });
        }

        if (onMapClickRef.current) {
          await map.setOnMapClickListener((e) => {
            onMapClickRef.current?.({ lat: e.latitude, lng: e.longitude });
          });
        }

        mapInstanceRef.current = map;
        document.documentElement.classList.add('native-map-active');
        setIsLoading(false);
      } catch (err) {
        if (!destroyed) {
          setInitError('Failed to load map');
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      destroyed = true;
      document.documentElement.classList.remove('native-map-active');
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pan when center/zoom change after init
  useEffect(() => {
    mapInstanceRef.current?.setCamera({
      coordinate: { lat: center.lat, lng: center.lng },
      zoom,
    });
  }, [center.lat, center.lng, zoom]);

  // Sync markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markers.length) return;

    const sync = async () => {
      await map.removeAllMapMarkers().catch(() => {});
      await map.addMarkers(
        markers.map((m) => ({
          coordinate: { lat: m.lat, lng: m.lng },
          title: m.title ?? '',
          snippet: m.snippet ?? '',
          ...(m.iconUrl ? { iconUrl: m.iconUrl } : {}),
        }))
      ).catch(() => {});
    };

    sync();
  }, [markers]);

  if (keyError || initError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg text-sm text-muted-foreground ${className}`}
        style={{ height }}
      >
        Map unavailable
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {(isLoading || keyLoading) && (
        <Skeleton className="absolute inset-0 z-10 rounded-lg" />
      )}
      {/* The native SDK renders behind the WebView at this element's position */}
      <div
        id={mapIdRef.current}
        ref={mapRef as any}
        style={{ display: 'block', width: '100%', height: '100%', backgroundColor: 'transparent' }}
      />
    </div>
  );
};

// ─── Web implementation ───────────────────────────────────────────────────────

const WebMapView = ({
  center,
  zoom = 14,
  markers = [],
  height = '100%',
  className = '',
  onMapClick,
  onMarkerClick,
}: CapacitorAwareMapProps) => {
  const { apiKey, loading: keyLoading, error: keyError } = useMapApiKey();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    let cancelled = false;

    const init = async () => {
      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({ apiKey, version: 'weekly', libraries: ['maps', 'marker'] });
        const { Map } = await loader.importLibrary('maps');

        if (cancelled || !containerRef.current) return;

        const map = new Map(containerRef.current, {
          center,
          zoom,
          mapId: 'neighbourlink-map',
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
        });

        if (onMapClickRef.current) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClickRef.current?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }
          });
        }

        mapRef.current = map;
        setIsLoading(false);
      } catch {
        if (!cancelled) {
          setInitError('Failed to load map');
          setIsLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pan when center/zoom change
  useEffect(() => {
    mapRef.current?.setCenter(center);
    if (zoom !== undefined) mapRef.current?.setZoom(zoom);
  }, [center.lat, center.lng, zoom]);

  // Sync markers
  const syncMarkers = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    const { Loader } = await import('@googlemaps/js-api-loader');
    const loader = new Loader({ apiKey: apiKey!, version: 'weekly', libraries: ['marker'] });
    await loader.importLibrary('marker');

    // Remove markers that no longer exist
    const incomingIds = new Set(markers.map((m) => m.id));
    markerRefs.current.forEach((marker, id) => {
      if (!incomingIds.has(id)) {
        marker.map = null;
        markerRefs.current.delete(id);
      }
    });

    // Add new markers
    for (const m of markers) {
      if (markerRefs.current.has(m.id)) continue;
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
      });
      if (onMarkerClickRef.current) {
        marker.addListener('click', () => onMarkerClickRef.current?.(m.id));
      }
      markerRefs.current.set(m.id, marker);
    }
  }, [markers, apiKey]);

  useEffect(() => {
    if (mapRef.current && apiKey) syncMarkers();
  }, [syncMarkers, apiKey]);

  if (keyError || initError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg text-sm text-muted-foreground ${className}`}
        style={{ height }}
      >
        Map unavailable
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {(isLoading || keyLoading) && (
        <Skeleton className="absolute inset-0 z-10 rounded-lg" />
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} className="rounded-lg overflow-hidden" />
    </div>
  );
};

// ─── Public export — auto-selects native or web ───────────────────────────────

export const CapacitorAwareMap = (props: CapacitorAwareMapProps) => {
  const native = isNativePlatform();
  return native ? <NativeMapView {...props} /> : <WebMapView {...props} />;
};
