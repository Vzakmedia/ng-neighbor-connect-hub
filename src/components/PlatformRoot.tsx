import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isNativePlatform } from '@/utils/nativeStartup';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import SplashScreen from '@/components/mobile/SplashScreen';
import OnboardingScreen from '@/components/mobile/OnboardingScreen';
import { AuthPage } from '@/components/auth/AuthPage';

// 'checking' = waiting for Preferences to tell us if this is a first launch
type NativeFlowStep = 'checking' | 'splash' | 'onboarding' | 'auth';

const ONBOARDING_COMPLETE_KEY = 'app_onboarding_complete';

/**
 * PlatformRoot - Smart root route handler
 *
 * Native App (first launch): Shows Splash → Onboarding → Auth flow
 * Native App (returning user): Skips straight to Auth (useRoutePersistence
 *   will navigate to the last route if the user is authenticated)
 * Web Browser: Shows Landing page
 */
const PlatformRoot = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Synchronous platform detection (instant, no loading state needed)
  const [isNativeApp] = useState(() => isNativePlatform());
  // Start in 'checking' so we never flash the splash before knowing launch type
  const [nativeFlowStep, setNativeFlowStep] = useState<NativeFlowStep>('checking');

  const syncWithServer = useNotificationStore(state => state.syncWithServer);

  // Initialize realtime notifications
  useRealtimeNotifications();

  // Sync notifications when user logs in
  useEffect(() => {
    if (user?.id && !loading) {
      syncWithServer(user.id);
    }
  }, [user?.id, loading, syncWithServer]);

  // Determine first-launch vs returning-user on mount
  useEffect(() => {
    if (!isNativeApp) return;

    import('@capacitor/preferences')
      .then(({ Preferences }) => Preferences.get({ key: ONBOARDING_COMPLETE_KEY }))
      .then(({ value }) => {
        if (value === 'true') {
          // Returning user — skip splash + onboarding entirely
          setNativeFlowStep('auth');
        } else {
          // First launch — show the full splash → onboarding → auth sequence
          setNativeFlowStep('splash');
        }
      })
      .catch(() => {
        // Fallback: show splash on any storage error
        setNativeFlowStep('splash');
      });
  }, [isNativeApp]);

  // Navigate authenticated users to dashboard immediately — no splash gate
  useEffect(() => {
    if (!isNativeApp) return;
    if (!loading && user) {
      const inProgress = (() => {
        try { return sessionStorage.getItem('deep_link_auth_in_progress'); }
        catch { return null; }
      })();
      if (inProgress) return;
      navigate('/dashboard', { replace: true });
    }
  }, [isNativeApp, user, loading, navigate]);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setNativeFlowStep('onboarding');
  };

  // Handle onboarding completion — mark so we never show it again
  const handleOnboardingComplete = async () => {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: ONBOARDING_COMPLETE_KEY, value: 'true' });
    } catch (_) { /* non-fatal */ }

    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    } else {
      setNativeFlowStep('auth');
    }
  };

  // Native app flow
  if (isNativeApp) {
    switch (nativeFlowStep) {
      case 'checking':
        // Render nothing while checking storage — the native Capacitor splash is
        // still visible at this point so the user sees no blank flash
        return null;
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;
      case 'onboarding':
        return <OnboardingScreen onGetStarted={handleOnboardingComplete} />;
      case 'auth':
        return <AuthPage />;
    }
  }

  // Web browser: redirect to dashboard if logged in, otherwise show Auth page
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthPage />;
};

export default PlatformRoot;
