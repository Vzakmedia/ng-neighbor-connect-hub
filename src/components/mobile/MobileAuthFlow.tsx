import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import SplashScreen from './SplashScreen';
import OnboardingScreen from './OnboardingScreen';
import { AuthPage } from '@/components/auth/AuthPage';
import { detectIOSDevice, safeFeatureDetection } from '@/utils/iosCompatibility';
import { safeStorage } from '@/utils/safetStorage';
import IOSSafeLanding from '@/components/common/IOSSafeLanding';

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
  const isNative = Capacitor.isNativePlatform();

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

      // Check if user has seen onboarding before
      let seenOnboarding = false;
      if (isNative) {
        // Use Capacitor Preferences for native (persists across app launches)
        const { value } = await Preferences.get({ key: 'neighborlink_onboarding_completed' });
        seenOnboarding = value === 'true';
      } else {
        // Use localStorage for web
        seenOnboarding = safeStorage.getItem('neighborlink_mobile_onboarding_seen') === 'true';
      }
      
      setHasSeenOnboarding(seenOnboarding);
    };
    
    initializeFlow();
  }, [isNative]);

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // If skipSplash is true and we're on onboarding, check if we should skip to auth
    if (skipSplash && currentStep === 'onboarding' && hasSeenOnboarding) {
      setCurrentStep('auth');
    }
  }, [skipSplash, currentStep, hasSeenOnboarding]);

  const handleSplashComplete = () => {
    if (hasSeenOnboarding) {
      setCurrentStep('auth');
    } else {
      setCurrentStep('onboarding');
    }
  };

  const handleGetStarted = async () => {
    // Mark mobile onboarding as seen
    if (isNative) {
      await Preferences.set({ key: 'neighborlink_onboarding_completed', value: 'true' });
    } else {
      safeStorage.setItem('neighborlink_mobile_onboarding_seen', 'true');
    }
    setCurrentStep('auth');
  };

  const handleIOSGetStarted = async () => {
    // Mark onboarding as seen and go directly to auth
    if (isNative) {
      await Preferences.set({ key: 'neighborlink_onboarding_completed', value: 'true' });
    } else {
      safeStorage.setItem('neighborlink_mobile_onboarding_seen', 'true');
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
      return hasSeenOnboarding || useIOSSafeLanding ? 
        <IOSSafeLanding onGetStarted={handleIOSGetStarted} /> : 
        <OnboardingScreen onGetStarted={handleGetStarted} />;
    case 'auth':
      return <AuthPage />;
    default:
      return <AuthPage />;
  }
};

export default MobileAuthFlow;