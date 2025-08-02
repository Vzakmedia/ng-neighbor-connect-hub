import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SplashScreen from './SplashScreen';
import OnboardingScreen from './OnboardingScreen';
import { AuthPage } from '@/components/auth/AuthPage';

type FlowStep = 'splash' | 'onboarding' | 'auth';

const MobileAuthFlow = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('splash');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has seen onboarding before (mobile app specific key)
    const seenOnboarding = localStorage.getItem('neighborlink_mobile_onboarding_seen');
    if (seenOnboarding) {
      setHasSeenOnboarding(true);
    }
  }, []);

  useEffect(() => {
    // Redirect authenticated users to main app
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSplashComplete = () => {
    if (hasSeenOnboarding) {
      setCurrentStep('auth');
    } else {
      setCurrentStep('onboarding');
    }
  };

  const handleGetStarted = () => {
    // Mark mobile onboarding as seen
    localStorage.setItem('neighborlink_mobile_onboarding_seen', 'true');
    setCurrentStep('auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (currentStep) {
    case 'splash':
      return <SplashScreen onComplete={handleSplashComplete} />;
    case 'onboarding':
      return <OnboardingScreen onGetStarted={handleGetStarted} />;
    case 'auth':
      return <AuthPage />;
    default:
      return <AuthPage />;
  }
};

export default MobileAuthFlow;