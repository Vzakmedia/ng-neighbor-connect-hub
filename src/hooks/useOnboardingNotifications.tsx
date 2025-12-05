import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface OnboardingPreferences {
  id: string;
  user_id: string;
  profile_completion_reminders: boolean;
  business_creation_reminders: boolean;
  last_business_card_shown_at: string | null;
  business_card_permanently_dismissed: boolean;
  profile_completion_dismissed: boolean;
  created_at: string;
  updated_at: string;
}

interface OnboardingStatus {
  profileComplete: boolean;
  hasBusiness: boolean;
  preferences: OnboardingPreferences | null;
}

export const useOnboardingNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
    profileComplete: false,
    hasBusiness: false,
    preferences: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchOnboardingStatus = async () => {
    if (!user) return;

    try {
      // Get user preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('user_onboarding_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefsError && prefsError.code !== 'PGRST116') {
        console.error('Error fetching preferences:', prefsError);
        return;
      }

      // Check if profile is complete
      const { data: profileCompleteData, error: profileError } = await supabase
        .rpc('is_profile_complete', { target_user_id: user.id });

      if (profileError) {
        console.error('Error checking profile completion:', profileError);
        return;
      }

      // Check if user has a business
      const { data: hasBusinessData, error: businessError } = await supabase
        .rpc('user_has_business', { target_user_id: user.id });

      if (businessError) {
        console.error('Error checking business status:', businessError);
        return;
      }

      setOnboardingStatus({
        profileComplete: profileCompleteData || false,
        hasBusiness: hasBusinessData || false,
        preferences: preferences || null,
      });

      // Create default preferences if they don't exist
      if (!preferences) {
        const { error: insertError } = await supabase
          .from('user_onboarding_preferences')
          .insert([{ user_id: user.id }]);

        if (insertError) {
          console.error('Error creating default preferences:', insertError);
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<OnboardingPreferences>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_onboarding_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        return;
      }

      // Refresh status
      await fetchOnboardingStatus();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const dismissBusinessCard = async (permanently: boolean = false) => {
    if (!user) return;

    const updates: Partial<OnboardingPreferences> = {
      last_business_card_shown_at: new Date().toISOString(),
    };

    if (permanently) {
      updates.business_card_permanently_dismissed = true;
      updates.business_creation_reminders = false;
    }

    try {
      const { error } = await supabase
        .from('user_onboarding_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately
      setOnboardingStatus(prev => ({
        ...prev,
        preferences: prev.preferences ? { ...prev.preferences, ...updates } : null,
      }));

      // Refetch to ensure sync
      await fetchOnboardingStatus();
    } catch (error) {
      console.error('Error dismissing business card:', error);
      throw error;
    }
  };

  const dismissProfileReminders = async () => {
    await updatePreferences({
      profile_completion_dismissed: true,
    });
  };

  const showProfileCompletionNotification = () => {
    if (!onboardingStatus.profileComplete && 
        onboardingStatus.preferences?.profile_completion_reminders &&
        !onboardingStatus.preferences?.profile_completion_dismissed) {
      
      toast({
        title: "Complete Your Profile",
        description: "Finish setting up your profile to get the most out of NeighborLink.",
        duration: 8000,
        action: (
          <button 
            onClick={() => navigate('/profile')}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Complete Profile
          </button>
        ),
      });
    }
  };

  const shouldShowBusinessCard = (): boolean => {
    if (!onboardingStatus.preferences) return false;
    if (onboardingStatus.hasBusiness) return false;
    if (onboardingStatus.preferences.business_card_permanently_dismissed) return false;
    if (!onboardingStatus.preferences.business_creation_reminders) return false;

    // Check if enough time has passed since last shown (24 hours minimum)
    if (onboardingStatus.preferences.last_business_card_shown_at) {
      const lastShown = new Date(onboardingStatus.preferences.last_business_card_shown_at);
      const hoursSinceLastShown = (Date.now() - lastShown.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastShown < 24) return false;
    }

    // Random chance to show (30% chance when conditions are met)
    return Math.random() < 0.3;
  };

  useEffect(() => {
    if (user) {
      fetchOnboardingStatus();
    }
  }, [user]);

  return {
    onboardingStatus,
    loading,
    updatePreferences,
    dismissBusinessCard,
    dismissProfileReminders,
    showProfileCompletionNotification,
    shouldShowBusinessCard,
    refetch: fetchOnboardingStatus,
  };
};