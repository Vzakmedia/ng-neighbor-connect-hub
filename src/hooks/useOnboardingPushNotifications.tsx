import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useOnboardingPushNotifications = () => {
  const { user } = useAuth();

  const sendNotification = async (options: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          badge: options.badge,
          tag: options.tag,
          data: options.data,
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    const checkOnboardingStatus = async () => {
      try {
        // Check if profile is complete
        const { data: profileComplete, error: profileError } = await supabase
          .rpc('is_profile_complete', { target_user_id: user.id });

        if (profileError) {
          console.error('Error checking profile completion:', profileError);
          return;
        }

        // Check user preferences
        const { data: preferences, error: prefsError } = await supabase
          .from('user_onboarding_preferences')
          .select('profile_completion_reminders, profile_completion_dismissed')
          .eq('user_id', user.id)
          .single();

        if (prefsError) {
          console.error('Error fetching preferences:', prefsError);
          return;
        }

        // Send push notification if profile is incomplete and user wants reminders
        if (!profileComplete && 
            preferences?.profile_completion_reminders && 
            !preferences?.profile_completion_dismissed) {
          
          await sendNotification({
            title: 'Complete Your NeighborLink Profile',
            body: 'Finish setting up your profile to connect better with your community and unlock all features.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'profile-completion',
            data: {
              type: 'profile_completion',
              url: '/profile'
            }
          });
        }
      } catch (error) {
        console.error('Error in onboarding push notifications:', error);
      }
    };

    // Check status on sign in (with delay to ensure proper initialization)
    const timer = setTimeout(checkOnboardingStatus, 3000);

    return () => clearTimeout(timer);
  }, [user, sendNotification]);

  return null;
};