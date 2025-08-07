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

  // Randomly show business card
  useEffect(() => {
    if (!loading && user && !showBusinessCard) {
      const checkAndShowBusinessCard = () => {
        if (shouldShowBusinessCard()) {
          // Random delay between 10-60 seconds after page load
          const delay = Math.random() * 50000 + 10000;
          setTimeout(() => {
            setShowBusinessCard(true);
          }, delay);
        }
      };

      // Check periodically (every 5 minutes) if we should show the card
      const interval = setInterval(() => {
        if (!showBusinessCard && shouldShowBusinessCard()) {
          setShowBusinessCard(true);
        }
      }, 5 * 60 * 1000);

      // Initial check
      checkAndShowBusinessCard();

      return () => clearInterval(interval);
    }
  }, [loading, user, showBusinessCard, shouldShowBusinessCard]);

  if (loading || !user) {
    return null;
  }

  return (
    <>
      {showBusinessCard && (
        <BusinessEncouragementCard 
          onDismiss={() => setShowBusinessCard(false)} 
        />
      )}
    </>
  );
};