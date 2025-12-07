import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface TutorialState {
  isOpen: boolean;
  hasCompletedTutorial: boolean;
  loading: boolean;
  platform: 'mobile' | 'desktop' | 'native';
}

const isNativePlatform = (): boolean => {
  return (window as any).Capacitor?.isNativePlatform?.() === true;
};

export const useTutorial = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const isMobileWeb = useIsMobile();
  const isNative = isNativePlatform();
  const platform = isNative ? 'native' : isMobileWeb ? 'mobile' : 'desktop';
  
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isOpen: false,
    hasCompletedTutorial: false,
    loading: true,
    platform,
  });

  useEffect(() => {
    // Update platform when it changes
    setTutorialState(prev => ({ ...prev, platform }));
  }, [platform]);

  useEffect(() => {
    // Only check tutorial status when both user and profile are available
    if (user && profile) {
      checkTutorialStatus();
    } else if (user && !profile) {
      // Reset loading state if user exists but profile is still loading
      setTutorialState(prev => ({ ...prev, loading: false, isOpen: false }));
    }
  }, [user, profile]);

  const checkTutorialStatus = async () => {
    if (!user || !profile) return;

    try {
      setTutorialState(prev => ({ ...prev, loading: true }));

      // Check if user has completed the tutorial
      const { data } = await supabase
        .from('user_onboarding_preferences')
        .select('tutorial_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      const hasCompletedTutorial = data?.tutorial_completed || false;
      
      setTutorialState(prev => ({
        ...prev,
        isOpen: false,
        hasCompletedTutorial,
        loading: false,
      }));

      // Show tutorial for new users who haven't completed it
      if (!hasCompletedTutorial) {
        console.log('Tutorial: User has not completed tutorial, will show after delay');
        // Small delay to ensure UI is ready
        setTimeout(() => {
          console.log('Tutorial: Showing tutorial now');
          setTutorialState(prev => ({ ...prev, isOpen: true }));
        }, 3000); // Increased delay to ensure everything is loaded
      } else {
        console.log('Tutorial: User has already completed tutorial');
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
      setTutorialState(prev => ({
        ...prev,
        isOpen: false,
        hasCompletedTutorial: false,
        loading: false,
      }));
    }
  };

  const startTutorial = () => {
    console.log('Tutorial: Manually starting tutorial');
    setTutorialState(prev => ({ ...prev, isOpen: true }));
  };

  const closeTutorial = () => {
    setTutorialState(prev => ({ ...prev, isOpen: false }));
  };

  const completeTutorial = async () => {
    if (!user) return;

    try {
      // Mark tutorial as completed
      await supabase
        .from('user_onboarding_preferences')
        .upsert(
          {
            user_id: user.id,
            tutorial_completed: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      setTutorialState(prev => ({
        ...prev,
        isOpen: false,
        hasCompletedTutorial: true,
        loading: false,
      }));

      toast({
        title: "Tutorial Complete! 🎉",
        description: "Welcome to NeighborLink! You're ready to connect with your community.",
      });
    } catch (error) {
      console.error('Error completing tutorial:', error);
      toast({
        title: "Error",
        description: "Failed to save tutorial progress.",
        variant: "destructive",
      });
    }
  };

  const resetTutorial = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_onboarding_preferences')
        .upsert(
          {
            user_id: user.id,
            tutorial_completed: false,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      setTutorialState(prev => ({
        ...prev,
        isOpen: false,
        hasCompletedTutorial: false,
        loading: false,
      }));

      toast({
        title: "Tutorial Reset",
        description: "You can now take the tutorial again.",
      });
    } catch (error) {
      console.error('Error resetting tutorial:', error);
      toast({
        title: "Error",
        description: "Failed to reset tutorial.",
        variant: "destructive",
      });
    }
  };

  return {
    ...tutorialState,
    startTutorial,
    closeTutorial,
    completeTutorial,
    resetTutorial,
  };
};
