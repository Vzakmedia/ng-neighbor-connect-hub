/**
 * Native-safe edge function caller utility
 * On native: Uses direct fetch (bypassing CapacitorHttp issues with supabase.functions.invoke)
 * On web: Uses normal supabase.functions.invoke
 */

import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://cowiviqhrnmhttugozbz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd2l2aXFocm5taHR0dWdvemJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTQ0NDQsImV4cCI6MjA2ODYzMDQ0NH0.BJ6OstIOar6CqEv__WzF9qZYaW12uQ-FfXYaVdxgJM4";

// Cache platform detection result
let isNativePlatformCached: boolean | null = null;

const checkIsNativePlatform = (): boolean => {
  if (isNativePlatformCached !== null) {
    return isNativePlatformCached;
  }
  
  try {
    // Use window.Capacitor which is injected by native runtime
    // This is safer than require() which may cause bundler issues
    const windowCapacitor = (window as any).Capacitor;
    isNativePlatformCached = windowCapacitor?.isNativePlatform?.() === true;
    console.log(`[NativeEdgeFunctions] Platform: ${isNativePlatformCached ? 'NATIVE' : 'WEB'}`);
    return isNativePlatformCached;
  } catch {
    isNativePlatformCached = false;
    return false;
  }
};

interface InvokeOptions {
  body?: Record<string, any>;
  headers?: Record<string, string>;
}

interface InvokeResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Invoke a Supabase edge function with native platform support
 * Automatically uses direct fetch on native to avoid CapacitorHttp issues
 */
export const invokeEdgeFunction = async <T = any>(
  functionName: string,
  options: InvokeOptions = {}
): Promise<InvokeResult<T>> => {
  const timestamp = Date.now();
  const isNative = checkIsNativePlatform();
  
  console.log(`[NativeEdgeFunctions] Invoking ${functionName}, timestamp: ${timestamp}, isNative: ${isNative}`);
  
  try {
    // Get access token
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    console.log(`[NativeEdgeFunctions] Session check: hasToken=${!!accessToken}, expires=${session?.expires_at}`);
    
    if (!accessToken) {
      // Try refresh
      console.log('[NativeEdgeFunctions] No token, attempting refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session?.access_token) {
        console.error('[NativeEdgeFunctions] Auth refresh failed:', refreshError);
        return {
          data: null,
          error: new Error('Authentication required. Please sign in.')
        };
      }
      
      console.log('[NativeEdgeFunctions] Session refreshed successfully');
    }
    
    const token = session?.access_token || (await supabase.auth.getSession()).data.session?.access_token;
    
    if (isNative) {
      // Native: Use direct fetch to bypass CapacitorHttp issues
      console.log(`[NativeEdgeFunctions] Using direct fetch for native platform`);
      return await invokeWithDirectFetch<T>(functionName, token, options);
    } else {
      // Web: Use standard supabase.functions.invoke
      console.log(`[NativeEdgeFunctions] Using supabase.functions.invoke for web`);
      return await invokeWithSupabase<T>(functionName, options);
    }
  } catch (error: any) {
    console.error(`[NativeEdgeFunctions] Error invoking ${functionName}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(error?.message || 'Unknown error')
    };
  }
};

/**
 * Direct fetch invocation for native platforms
 */
const invokeWithDirectFetch = async <T>(
  functionName: string,
  accessToken: string | undefined,
  options: InvokeOptions
): Promise<InvokeResult<T>> => {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  
  console.log(`[NativeEdgeFunctions] Direct fetch to: ${url}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    ...options.headers
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    console.log(`[NativeEdgeFunctions] Direct fetch response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NativeEdgeFunctions] Direct fetch error: ${response.status} - ${errorText}`);
      return {
        data: null,
        error: new Error(`HTTP ${response.status}: ${errorText}`)
      };
    }
    
    const data = await response.json();
    console.log(`[NativeEdgeFunctions] Direct fetch success`);
    
    return { data, error: null };
  } catch (error: any) {
    console.error(`[NativeEdgeFunctions] Direct fetch network error:`, error);
    return {
      data: null,
      error: new Error(error?.message || 'Network error')
    };
  }
};

/**
 * Standard supabase.functions.invoke for web
 */
const invokeWithSupabase = async <T>(
  functionName: string,
  options: InvokeOptions
): Promise<InvokeResult<T>> => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: options.body,
      headers: options.headers
    });
    
    if (error) {
      console.error(`[NativeEdgeFunctions] Supabase invoke error:`, error);
      return { data: null, error };
    }
    
    console.log(`[NativeEdgeFunctions] Supabase invoke success`);
    return { data, error: null };
  } catch (error: any) {
    console.error(`[NativeEdgeFunctions] Supabase invoke exception:`, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(error?.message || 'Unknown error')
    };
  }
};

/**
 * Check network status safely on native
 */
export const checkNetworkStatus = async (): Promise<{ connected: boolean; connectionType: string }> => {
  const isNative = checkIsNativePlatform();
  
  if (!isNative) {
    return { connected: navigator.onLine, connectionType: 'unknown' };
  }
  
  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    console.log('[NativeEdgeFunctions] Network status:', status);
    return {
      connected: status.connected,
      connectionType: status.connectionType
    };
  } catch (error) {
    console.warn('[NativeEdgeFunctions] Could not check network status:', error);
    return { connected: navigator.onLine, connectionType: 'unknown' };
  }
};

export { checkIsNativePlatform };
