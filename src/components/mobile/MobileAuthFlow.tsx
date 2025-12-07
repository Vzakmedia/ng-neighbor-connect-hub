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

type FlowStep = 'splash' | 'onboarding' | 'auth';

interface MobileAuthFlowProps {
  skipSplash?: boolean; // Used by NativeAppWrapper to skip splash (already shown)
}

const MobileAuthFlow = ({ skipSplash = false }: MobileAuthFlowProps) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>(skipSplash ? 'onboarding' : 'splash');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [useIOSSafeLanding, setUseIOSSafeLanding] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isNative = isNativePlatform();

  useEffect(() => {
    const initializeFlow = async () => {
      // Detect iOS device and determine if we need safe landing
      const deviceInfo = detectIOSDevice();
      const supportsAdvancedFeatures = safeFeatureDetection.supportsFramerMotion() && 
                                     safeFeatureDetection.supportsModernJS();
      
      console.log('MobileAuthFlow - Device compatibility:', {
        isIOS: deviceInfo.isIOS,
        supportsAdvanced: supportsAdvancedFeatures,
        localStorage: deviceInfo.supportsLocalStorage,
        iosVersion: deviceInfo.version
      });

      // Use iOS safe landing for older iOS (< 12) or when advanced features aren't supported
      if (deviceInfo.isIOS && (!supportsAdvancedFeatures || (deviceInfo.version && deviceInfo.version < 12))) {
        setUseIOSSafeLanding(true);
      }

      // Check onboarding status based on authentication
      if (user) {
        // User is authenticated, check their profile in database
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_completed_onboarding')
          .eq('id', user.id)
          .single();
        
        setHasSeenOnboarding(profile?.has_completed_onboarding ?? false);
      } else {
        // Not authenticated, always show onboarding
        setHasSeenOnboarding(false);
      }
    };
    
    initializeFlow();
  }, [user]);

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Only skip onboarding if user is authenticated AND has completed it before
    // For unauthenticated users, always show onboarding
    if (skipSplash && currentStep === 'onboarding' && hasSeenOnboarding && user) {
      setCurrentStep('auth');
    }
  }, [skipSplash, currentStep, hasSeenOnboarding, user]);

  const handleSplashComplete = () => {
    if (hasSeenOnboarding) {
      setCurrentStep('auth');
    } else {
      setCurrentStep('onboarding');
    }
  };

  const handleGetStarted = async () => {
    // Update database if user is authenticated
    if (user) {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);
    }
    setCurrentStep('auth');
  };

  const handleIOSGetStarted = async () => {
    // Update database if user is authenticated
    if (user) {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);
    }
    setCurrentStep('auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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