import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isNativePlatform } from '@/utils/nativeStartup';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import Landing from '@/pages/Landing';
import SplashScreen from '@/components/mobile/SplashScreen';

/**
 * Get timestamp for logging
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * PlatformRoot - Smart root route handler
 * 
 * Detects platform and authentication status to route users appropriately:
 * 
 * Native App (Capacitor):
 * - Authenticated → /dashboard
 * - Not Authenticated → /auth (shows NativeAppWrapper with splash + onboarding)
 * 
 * Web Browser:
 * - Shows Landing page (marketing content)
 */
const PlatformRoot = () => {
  const mountTimestamp = getTimestamp();
  console.log(`[PlatformRoot ${mountTimestamp}] ========== COMPONENT MOUNTED ==========`);
  
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [platformChecked, setPlatformChecked] = useState(false);
  const [emergencyTimeout, setEmergencyTimeout] = useState(false);
  const syncWithServer = useNotificationStore(state => state.syncWithServer);
  
  // Safe native platform detection
  useEffect(() => {
    const timestamp = getTimestamp();
    console.log(`[PlatformRoot ${timestamp}] Running platform detection...`);
    const native = isNativePlatform();
    console.log(`[PlatformRoot ${timestamp}] Platform detection result: isNative=${native}`);
    setIsNativeApp(native);
    setPlatformChecked(true);
    console.log(`[PlatformRoot ${timestamp}] Platform state updated`);
  }, []);
  
  // Emergency fallback timeout - force app out of loading state after 15s
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading || !platformChecked) {
        console.warn(`[PlatformRoot ${getTimestamp()}] EMERGENCY TIMEOUT - forcing app out of loading state`);
        setEmergencyTimeout(true);
        setPlatformChecked(true);
      }
    }, 15000);
    
    return () => clearTimeout(timeout);
  }, [loading, platformChecked]);
  
  // Initialize real-time notifications only after platform is checked (deferred)
  const shouldInitRealtime = platformChecked && !loading;
  useRealtimeNotifications();
  
  // Sync notifications with server when user logs in
  useEffect(() => {
    if (user?.id && shouldInitRealtime) {
      const timestamp = getTimestamp();
      console.log(`[PlatformRoot ${timestamp}] User logged in, syncing notifications for user: ${user.id.substring(0, 8)}...`);
      syncWithServer(user.id);
    }
  }, [user?.id, syncWithServer, shouldInitRealtime]);

  // Log auth state changes
  useEffect(() => {
    const timestamp = getTimestamp();
    console.log(`[PlatformRoot ${timestamp}] Auth state changed: loading=${loading}, user=${user ? user.id.substring(0, 8) + '...' : 'null'}`);
  }, [user, loading]);

  useEffect(() => {
    const timestamp = getTimestamp();
    console.log(`[PlatformRoot ${timestamp}] Navigation effect triggered: loading=${loading}, platformChecked=${platformChecked}, isNativeApp=${isNativeApp}, user=${user ? 'yes' : 'no'}`);
    
    if (loading) {
      console.log(`[PlatformRoot ${timestamp}] Auth still loading, waiting...`);
      return;
    }
    
    if (!platformChecked) {
      console.log(`[PlatformRoot ${timestamp}] Platform not checked yet, waiting...`);
      return;
    }

    // Native app logic
    if (isNativeApp) {
      if (user) {
        console.log(`[PlatformRoot ${timestamp}] NATIVE + AUTHENTICATED → navigating to /dashboard`);
        navigate('/dashboard', { replace: true });
      } else {
        console.log(`[PlatformRoot ${timestamp}] NATIVE + UNAUTHENTICATED → navigating to /auth`);
        navigate('/auth', { replace: true });
      }
    } else {
      console.log(`[PlatformRoot ${timestamp}] WEB platform → showing Landing page`);
    }
  }, [isNativeApp, platformChecked, user, loading, navigate]);

  // Show splash screen during initial auth check (unless emergency timeout triggered)
  if ((loading || !platformChecked) && !emergencyTimeout) {
    const timestamp = getTimestamp();
    console.log(`[PlatformRoot ${timestamp}] Rendering: SplashScreen (loading=${loading}, platformChecked=${platformChecked})`);
    return <SplashScreen onComplete={() => {}} />;
  }

  // For native apps, show splash while navigating
  if (isNativeApp) {
    const timestamp = getTimestamp();
    console.log(`[PlatformRoot ${timestamp}] Rendering: SplashScreen (native app, waiting for navigation)`);
    return <SplashScreen onComplete={() => {}} />;
  }

  // Web browser: show landing page
  const timestamp = getTimestamp();
  console.log(`[PlatformRoot ${timestamp}] Rendering: Landing page (web browser)`);
  return <Landing />;
};

export default PlatformRoot;
