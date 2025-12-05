import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isNativePlatform } from '@/utils/nativeStartup';
import { nativeStorageAdapter } from '@/utils/nativeStorageAdapter';
import SplashScreen from './SplashScreen';
import MobileAuthFlow from './MobileAuthFlow';

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
  const [showSplash, setShowSplash] = useState(true);
  const [splashShownThisSession, setSplashShownThisSession] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Safe native platform detection
  useEffect(() => {
    setIsNative(isNativePlatform());
  }, []);

  useEffect(() => {
    const checkSplashStatus = async () => {
      try {
        // Use nativeStorageAdapter which handles native/web automatically
        const value = await nativeStorageAdapter.getItem('splash_shown_session');
        if (value === 'true') {
          setShowSplash(false);
          setSplashShownThisSession(true);
        }
      } catch (error) {
        console.warn('[NativeAppWrapper] Error checking splash status:', error);
        // Fallback to sessionStorage
        const shownThisSession = sessionStorage.getItem('splash_shown');
        if (shownThisSession) {
          setShowSplash(false);
          setSplashShownThisSession(true);
        }
      }
    };
    
    checkSplashStatus();
  }, []);

  const handleSplashComplete = async () => {
    try {
      // Use nativeStorageAdapter which handles native/web automatically
      await nativeStorageAdapter.setItem('splash_shown_session', 'true');
    } catch (error) {
      console.warn('[NativeAppWrapper] Error saving splash status:', error);
      // Fallback to sessionStorage
      sessionStorage.setItem('splash_shown', 'true');
    }
    setSplashShownThisSession(true);
    setShowSplash(false);
  };

  useEffect(() => {
    // After splash is complete, redirect based on auth status
    if (!loading && splashShownThisSession && !showSplash) {
      if (user) {
        // User is authenticated, go to dashboard
        navigate('/dashboard', { replace: true });
      }
      // If not authenticated, stay on this component to show MobileAuthFlow
    }
  }, [user, loading, splashShownThisSession, showSplash, navigate]);

  // Show loading spinner during initial auth check
  if (loading && !splashShownThisSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show splash screen first
  if (showSplash && !splashShownThisSession) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // After splash, if not authenticated, show the auth flow (onboarding + auth forms)
  if (!user) {
    return <MobileAuthFlow skipSplash={true} />;
  }

  // If authenticated, we'll navigate in the useEffect above
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default NativeAppWrapper;
