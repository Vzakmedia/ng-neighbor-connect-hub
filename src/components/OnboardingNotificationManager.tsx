import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingNotifications } from '@/hooks/useOnboardingNotifications';
import { useOnboardingPushNotifications } from '@/hooks/useOnboardingPushNotifications';
import { BusinessEncouragementCard } from './BusinessEncouragementCard';

export const OnboardingNotificationManager = () => {
  const { user } = useAuth();
  const { 
    onboardingStatus, 
    loading, 
    showProfileCompletionNotification,
    shouldShowBusinessCard 
  } = useOnboardingNotifications();
  
  // Initialize push notifications for onboarding
  useOnboardingPushNotifications();
  
  const [showBusinessCard, setShowBusinessCard] = useState(false);
  const [hasShownProfileNotification, setHasShownProfileNotification] = useState(false);
  const [hasCheckedBusinessCard, setHasCheckedBusinessCard] = useState(false);

  // Session storage key to prevent re-showing within the same session
  const SESSION_KEY = 'business_card_dismissed_session';

  // Show profile completion notification on sign in
  useEffect(() => {
    if (user && !loading && !hasShownProfileNotification) {
      // Delay to ensure the user has fully loaded into the app
      const timer = setTimeout(() => {
        showProfileCompletionNotification();
        setHasShownProfileNotification(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, loading, showProfileCompletionNotification, hasShownProfileNotification]);

  // Show business card once per session
  useEffect(() => {
    // Check if dismissed in this session
    const dismissedInSession = sessionStorage.getItem(SESSION_KEY);
    if (dismissedInSession) {
      setHasCheckedBusinessCard(true);
      return;
    }

    // Only check once per session
    if (!loading && user && !hasCheckedBusinessCard && !showBusinessCard) {
      if (shouldShowBusinessCard()) {
        // Random delay between 10-60 seconds after page load
        const delay = Math.random() * 50000 + 10000;
        const timer = setTimeout(() => {
          setShowBusinessCard(true);
        }, delay);
        
        setHasCheckedBusinessCard(true);
        return () => clearTimeout(timer);
      } else {
        setHasCheckedBusinessCard(true);
      }
    }
  }, [loading, user, hasCheckedBusinessCard, showBusinessCard, shouldShowBusinessCard, onboardingStatus]);

  if (loading || !user) {
    return null;
  }

  const handleDismiss = () => {
    setShowBusinessCard(false);
    setHasCheckedBusinessCard(true);
    sessionStorage.setItem(SESSION_KEY, 'true');
  };

  return (
    <>
      {showBusinessCard && (
        <BusinessEncouragementCard 
          onDismiss={handleDismiss} 
        />
      )}
    </>
  );
};