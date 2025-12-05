import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isNativePlatform } from '@/utils/nativeStartup';
import { nativeStorageAdapter } from '@/utils/nativeStorageAdapter';
import SplashScreen from './SplashScreen';
import MobileAuthFlow from './MobileAuthFlow';

/**
 * Get timestamp for logging
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * NativeAppWrapper - Master wrapper for native mobile app experience
 * 
 * Always shows splash screen first (even for authenticated users),
 * then navigates based on authentication status:
 * - Authenticated → Dashboard
 * - Not Authenticated → MobileAuthFlow (onboarding + auth)
 * 
 * Splash shows only once per app session (not on every navigation)
 */
const NativeAppWrapper = () => {
  const mountTimestamp = getTimestamp();
  console.log(`[NativeAppWrapper ${mountTimestamp}] ========== COMPONENT MOUNTED ==========`);
  
  const [showSplash, setShowSplash] = useState(true);
  const [splashShownThisSession, setSplashShownThisSession] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log(`[NativeAppWrapper ${mountTimestamp}] Initial state: showSplash=${showSplash}, splashShownThisSession=${splashShownThisSession}, isNative=${isNative}`);
  console.log(`[NativeAppWrapper ${mountTimestamp}] Auth state: loading=${loading}, user=${user ? user.id.substring(0, 8) + '...' : 'null'}`);

  // Safe native platform detection
  useEffect(() => {
    const timestamp = getTimestamp();
    console.log(`[NativeAppWrapper ${timestamp}] Running platform detection...`);
    const native = isNativePlatform();
    console.log(`[NativeAppWrapper ${timestamp}] Platform detection result: isNative=${native}`);
    setIsNative(native);
  }, []);

  useEffect(() => {
    const checkSplashStatus = async () => {
      const timestamp = getTimestamp();
      console.log(`[NativeAppWrapper ${timestamp}] Checking splash status from storage...`);
      
      try {
        // Use nativeStorageAdapter which handles native/web automatically
        const value = await nativeStorageAdapter.getItem('splash_shown_session');
        console.log(`[NativeAppWrapper ${timestamp}] Storage returned: '${value}'`);
        
        if (value === 'true') {
          console.log(`[NativeAppWrapper ${timestamp}] Splash already shown this session, hiding splash`);
          setShowSplash(false);
          setSplashShownThisSession(true);
        } else {
          console.log(`[NativeAppWrapper ${timestamp}] Splash not shown yet, will show splash`);
        }
      } catch (error) {
        console.warn(`[NativeAppWrapper ${timestamp}] Error checking splash status:`, error);
        // Fallback to sessionStorage
        console.log(`[NativeAppWrapper ${timestamp}] Trying sessionStorage fallback...`);
        const shownThisSession = sessionStorage.getItem('splash_shown');
        console.log(`[NativeAppWrapper ${timestamp}] sessionStorage returned: '${shownThisSession}'`);
        
        if (shownThisSession) {
          console.log(`[NativeAppWrapper ${timestamp}] Splash shown (via sessionStorage), hiding splash`);
          setShowSplash(false);
          setSplashShownThisSession(true);
        }
      }
    };
    
    checkSplashStatus();
  }, []);

  const handleSplashComplete = async () => {
    const timestamp = getTimestamp();
    console.log(`[NativeAppWrapper ${timestamp}] ========== SPLASH COMPLETE CALLBACK ==========`);
    
    try {
      console.log(`[NativeAppWrapper ${timestamp}] Saving splash status to storage...`);
      await nativeStorageAdapter.setItem('splash_shown_session', 'true');
      console.log(`[NativeAppWrapper ${timestamp}] Splash status saved successfully`);
    } catch (error) {
      console.warn(`[NativeAppWrapper ${timestamp}] Error saving splash status:`, error);
      // Fallback to sessionStorage
      console.log(`[NativeAppWrapper ${timestamp}] Using sessionStorage fallback...`);
      sessionStorage.setItem('splash_shown', 'true');
    }
    
    console.log(`[NativeAppWrapper ${timestamp}] Updating state: splashShownThisSession=true, showSplash=false`);
    setSplashShownThisSession(true);
    setShowSplash(false);
  };

  useEffect(() => {
    const timestamp = getTimestamp();
    console.log(`[NativeAppWrapper ${timestamp}] Navigation effect: loading=${loading}, splashShownThisSession=${splashShownThisSession}, showSplash=${showSplash}, user=${user ? 'yes' : 'no'}`);
    
    // After splash is complete, redirect based on auth status
    if (!loading && splashShownThisSession && !showSplash) {
      if (user) {
        console.log(`[NativeAppWrapper ${timestamp}] AUTHENTICATED after splash → navigating to /dashboard`);
        navigate('/dashboard', { replace: true });
      } else {
        console.log(`[NativeAppWrapper ${timestamp}] UNAUTHENTICATED after splash → staying to show MobileAuthFlow`);
      }
    }
  }, [user, loading, splashShownThisSession, showSplash, navigate]);

  // Render decision logging
  const renderTimestamp = getTimestamp();

  // Show loading spinner during initial auth check
  if (loading && !splashShownThisSession) {
    console.log(`[NativeAppWrapper ${renderTimestamp}] Rendering: Loading spinner (auth loading, no splash yet)`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show splash screen first
  if (showSplash && !splashShownThisSession) {
    console.log(`[NativeAppWrapper ${renderTimestamp}] Rendering: SplashScreen`);
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // After splash, if not authenticated, show the auth flow (onboarding + auth forms)
  if (!user) {
    console.log(`[NativeAppWrapper ${renderTimestamp}] Rendering: MobileAuthFlow (user not authenticated)`);
    return <MobileAuthFlow skipSplash={true} />;
  }

  // If authenticated, we'll navigate in the useEffect above
  console.log(`[NativeAppWrapper ${renderTimestamp}] Rendering: Loading spinner (authenticated, waiting for navigation)`);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default NativeAppWrapper;
