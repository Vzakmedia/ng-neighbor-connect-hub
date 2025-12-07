import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isNativePlatform } from '@/utils/nativeStartup';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import Landing from '@/pages/Landing';
import SplashScreen from '@/components/mobile/SplashScreen';
import OnboardingScreen from '@/components/mobile/OnboardingScreen';
import { AuthPage } from '@/components/auth/AuthPage';

/**
 * Get timestamp for logging
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

type NativeFlowStep = 'splash' | 'onboarding' | 'auth';

/**
 * PlatformRoot - Smart root route handler
 * 
 * Detects platform and authentication status to route users appropriately:
 * 
 * Native App (Capacitor):
 * - Shows Splash → Onboarding → Auth flow
 * - Auth checking happens in background during splash/onboarding
 * - If authenticated by end of onboarding → /dashboard
 * - If not authenticated → show AuthPage
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
  const [nativeFlowStep, setNativeFlowStep] = useState<NativeFlowStep>('splash');
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

  // Auto-navigate to dashboard if user becomes authenticated during onboarding/auth
  useEffect(() => {
    const timestamp = getTimestamp();
    
    if (!isNativeApp || !platformChecked) return;
    
    // If user is authenticated and we're past splash, go to dashboard
    if (!loading && user && nativeFlowStep !== 'splash') {
      console.log(`[PlatformRoot ${timestamp}] User authenticated during ${nativeFlowStep}, navigating to dashboard`);
      navigate('/dashboard', { replace: true });
    }
  }, [isNativeApp, platformChecked, user, loading, nativeFlowStep, navigate]);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    const timestamp = getTimestamp();
    console.log(`[PlatformRoot ${timestamp}] Splash complete, moving to onboarding. Auth status: loading=${loading}, user=${user ? 'yes' : 'no'}`);
    setNativeFlowStep('onboarding');
  };

  // Handle onboarding completion (Get Started / I Have an Account)
  const handleOnboardingComplete = () => {
    const timestamp = getTimestamp();
    console.log(`[PlatformRoot ${timestamp}] Onboarding complete. Auth status: loading=${loading}, user=${user ? 'yes' : 'no'}`);
    
    // If auth check is done and user is authenticated, go to dashboard
    if (!loading && user) {
      console.log(`[PlatformRoot ${timestamp}] User already authenticated, navigating to dashboard`);
      navigate('/dashboard', { replace: true });
    } else {
      // Show auth page
      console.log(`[PlatformRoot ${timestamp}] User not authenticated, showing auth page`);
      setNativeFlowStep('auth');
    }
  };


  // Stable noop callback for platform check splash
  const noopCallback = useCallback(() => {}, []);

  // Show splash screen during initial platform check (unless emergency timeout triggered)
  if (!platformChecked && !emergencyTimeout) {
    return <SplashScreen onComplete={noopCallback} />;
  }

  // Native app flow: Splash → Onboarding → Auth
  if (isNativeApp) {
    const timestamp = getTimestamp();
    
    switch (nativeFlowStep) {
      case 'splash':
        console.log(`[PlatformRoot ${timestamp}] Rendering: SplashScreen (native flow step)`);
        return <SplashScreen onComplete={handleSplashComplete} />;
      
      case 'onboarding':
        console.log(`[PlatformRoot ${timestamp}] Rendering: OnboardingScreen (auth running in background: loading=${loading})`);
        return <OnboardingScreen onGetStarted={handleOnboardingComplete} />;
      
      case 'auth':
        console.log(`[PlatformRoot ${timestamp}] Rendering: AuthPage`);
        return <AuthPage />;
    }
  }

  // Web browser: show landing page
  const timestamp = getTimestamp();
  console.log(`[PlatformRoot ${timestamp}] Rendering: Landing page (web browser)`);
  return <Landing />;
};

export default PlatformRoot;
