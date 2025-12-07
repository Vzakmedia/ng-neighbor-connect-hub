import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isNativePlatform } from '@/utils/nativeStartup';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import Landing from '@/pages/Landing';
import SplashScreen from '@/components/mobile/SplashScreen';
import OnboardingScreen from '@/components/mobile/OnboardingScreen';
import { AuthPage } from '@/components/auth/AuthPage';

type NativeFlowStep = 'splash' | 'onboarding' | 'auth';

/**
 * PlatformRoot - Smart root route handler
 * 
 * Native App: Shows Splash → Onboarding → Auth flow
 * Web Browser: Shows Landing page
 */
const PlatformRoot = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Synchronous platform detection (instant, no loading state needed)
  const [isNativeApp] = useState(() => isNativePlatform());
  const [nativeFlowStep, setNativeFlowStep] = useState<NativeFlowStep>('splash');
  
  const syncWithServer = useNotificationStore(state => state.syncWithServer);
  
  // Initialize realtime notifications
  useRealtimeNotifications();
  
  // Sync notifications when user logs in
  useEffect(() => {
    if (user?.id && !loading) {
      console.log('[PlatformRoot] Syncing notifications for user');
      syncWithServer(user.id);
    }
  }, [user?.id, loading, syncWithServer]);

  // Auto-navigate to dashboard if authenticated during native flow
  useEffect(() => {
    if (!isNativeApp) return;
    if (!loading && user && nativeFlowStep !== 'splash') {
      console.log('[PlatformRoot] User authenticated, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isNativeApp, user, loading, nativeFlowStep, navigate]);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    console.log('[PlatformRoot] Splash complete, moving to onboarding');
    setNativeFlowStep('onboarding');
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    if (!loading && user) {
      console.log('[PlatformRoot] User already authenticated, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    } else {
      console.log('[PlatformRoot] Showing auth page');
      setNativeFlowStep('auth');
    }
  };

  // Native app flow: Splash → Onboarding → Auth
  if (isNativeApp) {
    switch (nativeFlowStep) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;
      case 'onboarding':
        return <OnboardingScreen onGetStarted={handleOnboardingComplete} />;
      case 'auth':
        return <AuthPage />;
    }
  }

  // Web browser: show landing page
  return <Landing />;
};

export default PlatformRoot;
