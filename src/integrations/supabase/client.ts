import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { nativeSyncStorage } from '@/utils/nativeSyncStorage';

// Read credentials from build-time env vars — no hardcoded fallbacks.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    '[Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in your .env file.'
  );
}

// Get fetch with safety guards for native platforms
// CapacitorHttp is now disabled, so standard fetch works correctly
const getUnpatchedFetch = (): typeof fetch => {
  // Safe fallback chain: stored original -> window.fetch -> throw error
  const originalFetch = (window as any).__originalFetch__;

  // Guard against undefined fetch on early native load
  if (originalFetch && typeof originalFetch === 'function') {
    console.log('[Supabase] Using stored original fetch');
    return wrapFetchWithLogging(originalFetch);
  }

  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    console.log('[Supabase] Using standard window.fetch');
    return wrapFetchWithLogging(window.fetch.bind(window));
  }

  console.error('[Supabase] No fetch implementation available!');
  throw new Error('No fetch implementation available');
};

// Wrap fetch with auth request logging for debugging
// Wrap fetch with auth request logging for debugging
const wrapFetchWithLogging = (baseFetch: typeof fetch): typeof fetch => {

  // Return a wrapped fetch
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    return baseFetch(input, init);
  };
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Safe Capacitor detection with defensive fallback
let cachedCapacitor: any = undefined; // undefined means not checked yet

const getCapacitor = () => {
  if (cachedCapacitor !== undefined) {
    return cachedCapacitor;
  }

  try {
    console.log('[Supabase] Checking for Capacitor...');
    // Use window.Capacitor which is injected by native runtime
    // This is safer than require() which may cause bundler issues
    const windowCapacitor = (window as any).Capacitor;
    if (windowCapacitor?.isNativePlatform?.()) {
      cachedCapacitor = windowCapacitor;
      console.log('[Supabase] Capacitor found, native:', true);
      return windowCapacitor;
    }
    console.log('[Supabase] Not on native platform (web mode)');
    cachedCapacitor = null;
    return null;
  } catch (error) {
    console.log('[Supabase] Capacitor check failed (web mode)');
    cachedCapacitor = null;
    return null;
  }
};

const isNativePlatform = () => {
  return !!getCapacitor();
};

// Use synchronous native storage on native platforms; fall back to the
// default localStorage adapter on web (undefined = Supabase default).
const getStorageAdapter = () => {
  if (!isNativePlatform()) {
    return undefined; // Supabase uses localStorage by default
  }
  console.log('[Supabase] Using nativeSyncStorage adapter');
  return nativeSyncStorage;
};

// Create Supabase client with synchronous storage adapter
const createSupabaseClient = () => {
  console.log('[Supabase] Creating client...');

  const storage = getStorageAdapter();
  const customFetch = getUnpatchedFetch();

  const clientConfig = {
    auth: {
      storage,
      // Always persist the session and auto-refresh the JWT so the user
      // stays logged in across page reloads, tab switches, and idle periods.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'neighborlink-auth',
      flowType: 'pkce' as const,
    },
    global: {
      headers: {
        'X-Client-Info': 'neighborlink-native-sync',
        'Cache-Control': 'no-cache',
      },
      // Use original fetch to bypass CapacitorHttp interception
      fetch: customFetch,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 15000,
      reconnectAfterMs: (tries: number) => Math.min(tries * 500, 5000),
    },
  };

  console.log('[Supabase] Client config ready');
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, clientConfig);
};

export const supabase = createSupabaseClient();

// Aggressive session refresh and validation
const validateAndRefreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session validation error:', error);
      return;
    }

    if (session) {
      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt - now < fiveMinutes) {
        console.log('Token expiring soon, refreshing...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Session refresh failed:', refreshError);
        } else {
          console.log('Session refreshed successfully');
        }
      }
    }
  } catch (error) {
    console.error('Error in validateAndRefreshSession:', error);
  }
};

// Add storage listener on native platforms to catch auth token changes
// (visibilitychange is intentionally omitted — autoRefreshToken handles that automatically)
if (typeof document !== 'undefined') {
  if (isNativePlatform()) {
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('sb-') && event.key?.includes('auth-token') || event.key === 'neighborlink-auth') {
        console.log('Auth storage changed, revalidating session');
        validateAndRefreshSession();
      }
    });
  }

  // CRITICAL: Defer initial session validation by 3 seconds
  // This prevents interference with login flow during app startup
  setTimeout(() => {
    console.log('Deferred session validation starting...');
    validateAndRefreshSession();
  }, 3000);
}
