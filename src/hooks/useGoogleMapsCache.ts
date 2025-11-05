import { useState, useEffect } from 'react';

const CACHE_KEYS = {
  GOOGLE_MAPS_API_KEY: 'google_maps_api_key',
  GEOCODE_PREFIX: 'geocode_',
  PLACE_ID_PREFIX: 'place_id_',
} as const;

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_EXPIRY;
};

const getFromCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    if (!isCacheValid(parsed.timestamp)) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

const setToCache = <T>(key: string, data: T): void => {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

export const useGoogleMapsCache = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchApiKey = async () => {
      // Try cache first
      const cachedKey = getFromCache<string>(CACHE_KEYS.GOOGLE_MAPS_API_KEY);
      if (cachedKey) {
        console.log('✅ [Maps Cache] Using cached API key');
        setApiKey(cachedKey);
        setIsLoading(false);
        return;
      }

      // Fetch from edge function
      try {
        console.log('🔄 [Maps Cache] Fetching API key from server...');
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

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error || !data.token) {
          throw new Error(data.error || 'No API key in response');
        }

        console.log('✅ [Maps Cache] API key fetched and cached');
        setApiKey(data.token);
        setToCache(CACHE_KEYS.GOOGLE_MAPS_API_KEY, data.token);
        setIsLoading(false);
      } catch (err: any) {
        console.error('❌ [Maps Cache] Error fetching API key:', err);
        setError(err.message || 'Failed to load map configuration');
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const cacheKey = `${CACHE_KEYS.GEOCODE_PREFIX}${address}`;
    
    // Try cache first
    const cached = getFromCache<{ lat: number; lng: number }>(cacheKey);
    if (cached) {
      console.log('✅ [Geocode Cache] Using cached coordinates for:', address);
      return cached;
    }

    // Geocode using Google Maps API
    try {
      if (!(window as any).google?.maps?.Geocoder) {
        throw new Error('Geocoder not available');
      }

      const geocoder = new (window as any).google.maps.Geocoder();
      const result = await geocoder.geocode({ address });

      if (result.results && result.results.length > 0) {
        const location = {
          lat: result.results[0].geometry.location.lat(),
          lng: result.results[0].geometry.location.lng()
        };
        
        console.log('✅ [Geocode Cache] Address geocoded and cached:', address);
        setToCache(cacheKey, location);
        return location;
      }

      return null;
    } catch (error) {
      console.error('❌ [Geocode Cache] Error geocoding:', error);
      return null;
    }
  };

  const getPlaceId = async (address: string): Promise<string | null> => {
    const cacheKey = `${CACHE_KEYS.PLACE_ID_PREFIX}${address}`;
    
    // Try cache first
    const cached = getFromCache<string>(cacheKey);
    if (cached) {
      console.log('✅ [Place ID Cache] Using cached Place ID for:', address);
      return cached;
    }

    // Geocode to get Place ID
    try {
      if (!(window as any).google?.maps?.Geocoder) {
        throw new Error('Geocoder not available');
      }

      const geocoder = new (window as any).google.maps.Geocoder();
      const result = await geocoder.geocode({ address });

      if (result.results && result.results.length > 0) {
        const placeId = result.results[0].place_id;
        
        console.log('✅ [Place ID Cache] Place ID fetched and cached:', address);
        setToCache(cacheKey, placeId);
        return placeId;
      }

      return null;
    } catch (error) {
      console.error('❌ [Place ID Cache] Error getting Place ID:', error);
      return null;
    }
  };

  return {
    apiKey,
    isLoading,
    error,
    geocodeAddress,
    getPlaceId,
  };
};
