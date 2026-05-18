import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;
import SplashScreen from './SplashScreen';
import OnboardingScreen from './OnboardingScreen';
import { AuthPage } from '@/components/auth/AuthPage';
import { detectIOSDevice, safeFeatureDetection } from '@/utils/iosCompatibility';
import IOSSafeLanding from '@/components/common/IOSSafeLanding';
import { supabase } from '@/integrations/supabase/client';

const ONBOARDING_KEY = 'neighborlink_onboarding_shown';

const readOnboardingShown = (): boolean => {
  try { return localStorage.getItem(ONBOARDING_KEY) === 'true'; } catch { return false; }
};

const saveOnboardingShown = () => {
  try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
};

type FlowStep = 'splash' | 'onboarding' | 'auth';

interface MobileAuthFlowProps {
  skipSplash?: boolean;
}

const MobileAuthFlow = ({ skipSplash = false }: MobileAuthFlowProps) => {
  const getInitialStep = (): FlowStep => {
    if (!skipSplash) return 'splash';
    return readOnboardingShown() ? 'auth' : 'onboarding';
  };

  const [currentStep, setCurrentStep] = useState<FlowStep>(getInitialStep);
  const [useIOSSafeLanding, setUseIOSSafeLanding] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isNative = isNativePlatform();

  useEffect(() => {
    const deviceInfo = detectIOSDevice();
    const supportsAdvancedFeatures = safeFeatureDetection.supportsFramerMotion() &&
                                     safeFeatureDetection.supportsModernJS();
    if (deviceInfo.isIOS && (!supportsAdvancedFeatures || (deviceInfo.version && deviceInfo.version < 12))) {
      setUseIOSSafeLanding(true);
    }
  }, []);

  // Redirect authenticated users straight to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSplashComplete = () => {
    if (readOnboardingShown()) {
      setCurrentStep('auth');
    } else {
      setCurrentStep('onboarding');
    }
  };

  const markOnboardingDone = async () => {
    saveOnboardingShown();
    if (user) {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);
    }
  };

  const handleGetStarted = async () => {
    await markOnboardingDone();
    setCurrentStep('auth');
  };

  const handleIOSGetStarted = async () => {
    await markOnboardingDone();
    setCurrentStep('auth');
  };

  // Use iOS safe landing if needed
  if (useIOSSafeLanding && currentStep === 'onboarding') {
    return <IOSSafeLanding onGetStarted={handleIOSGetStarted} />;
  }

  switch (currentStep) {
    case 'splash':
      return <SplashScreen onComplete={handleSplashComplete} />;
    case 'onboarding':
      // Always show full onboarding for new/unauthenticated users on native
      if (useIOSSafeLanding) {
        return <IOSSafeLanding onGetStarted={handleIOSGetStarted} />;
      }
      return <OnboardingScreen onGetStarted={handleGetStarted} />;
    case 'auth':
      return <AuthPage />;
    default:
      return <AuthPage />;
  }
};

export default MobileAuthFlow;