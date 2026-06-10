import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Module-level cache — all map instances on screen share one fetch.
let cachedKey: string | null = null;
let fetchPromise: Promise<string> | null = null;

async function resolveApiKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    // 1. Env var shortcut (local dev / CI)
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (envKey) {
      cachedKey = envKey;
      return envKey;
    }

    // 2. Supabase edge function
    const { data, error } = await supabase.functions.invoke('get-google-maps-token');
    if (error || !data?.token) throw new Error('Failed to fetch Google Maps API key');

    if (!/^AIza[A-Za-z0-9_\-]{35}$/.test(data.token)) {
      throw new Error('Invalid Google Maps API key format');
    }

    cachedKey = data.token;
    return data.token as string;
  })().catch((err) => {
    fetchPromise = null; // allow retry on next call
    throw err;
  });

  return fetchPromise;
}

interface UseMapApiKeyResult {
  apiKey: string | null;
  loading: boolean;
  error: string | null;
}

export function useMapApiKey(): UseMapApiKeyResult {
  const [apiKey, setApiKey] = useState<string | null>(cachedKey);
  const [loading, setLoading] = useState(!cachedKey);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedKey) return;

    let cancelled = false;
    setLoading(true);

    resolveApiKey()
      .then((key) => {
        if (cancelled) return;
        setApiKey(key);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Map key unavailable');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { apiKey, loading, error };
}
