import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

// Global promise to track script loading status across hook instances
let scriptLoadingPromise: Promise<void> | null = null;

export const useGoogleMapsCache = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializeMaps = async () => {
      try {
        // 1. Check if already loaded
        if (window.google?.maps) {
          setIsScriptLoaded(true);
          setIsLoading(false);
          return;
        }

        // 2. Get API Key
        let currentApiKey = getFromCache<string>(CACHE_KEYS.GOOGLE_MAPS_API_KEY);

        if (!currentApiKey) {
          console.log('🔄 [Maps Cache] Fetching API key from server...');
          const { data, error: apiError } = await supabase.functions.invoke('get-google-maps-token');

          if (apiError || !data?.token) {
            throw new Error(apiError?.message || 'Failed to retrieve API key');
          }

          currentApiKey = data.token;
          setToCache(CACHE_KEYS.GOOGLE_MAPS_API_KEY, currentApiKey);
          console.log('✅ [Maps Cache] API key fetched and cached');
        } else {
          console.log('✅ [Maps Cache] Using cached API key');
        }

        setApiKey(currentApiKey!);

        // 3. Load Script
        if (!scriptLoadingPromise) {
          scriptLoadingPromise = new Promise((resolve, reject) => {
            if (window.google?.maps) {
              resolve();
              return;
            }

            // Check if script tag already exists
            if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
              // Wait for it to load? For now assuming if it exists it will handle itself or we can attach listener?
              // Safer to just create our own if we can't find the window object, but that might duplicate.
              // Let's attach a listener to the existing script if possible, or poll.
              const checkInterval = setInterval(() => {
                if (window.google?.maps) {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 100);
              return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${currentApiKey}&libraries=places,marker&region=NG&language=en&loading=async`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Maps script'));
            document.head.appendChild(script);
          });
        }

        await scriptLoadingPromise;
        setIsScriptLoaded(true);
        setIsLoading(false);

      } catch (err: any) {
        console.error('❌ [Maps Cache] Error initializing:', err);
        setError(err.message || 'Failed to load map configuration');
        setIsLoading(false);
      }
    };

    initializeMaps();
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
      if (!isScriptLoaded && !window.google?.maps) {
        // Try to wait for it? or throw specific error asking caller to wait
        if (isLoading) {
          // Basic wait loop for a few seconds
          const start = Date.now();
          while (!window.google?.maps && Date.now() - start < 3000) {
            await new Promise(r => setTimeout(r, 100));
          }
        }
      }

      if (!window.google?.maps?.Geocoder) {
        throw new Error('Geocoder not available (script not loaded)');
      }

      const geocoder = new window.google.maps.Geocoder();
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
      if (!window.google?.maps?.Geocoder) {
        throw new Error('Geocoder not available');
      }

      const geocoder = new window.google.maps.Geocoder();
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
    isScriptLoaded,
    error,
    geocodeAddress,
    getPlaceId,
  };
};
