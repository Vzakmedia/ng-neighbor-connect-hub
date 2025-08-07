import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TutorialState {
  isOpen: boolean;
  hasCompletedTutorial: boolean;
  loading: boolean;
}

export const useTutorial = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isOpen: false,
    hasCompletedTutorial: false,
    loading: true,
  });

  useEffect(() => {
    if (user) {
      checkTutorialStatus();
    }
  }, [user]);

  const checkTutorialStatus = async () => {
    if (!user) return;

    try {
      setTutorialState(prev => ({ ...prev, loading: true }));

      // Check if user has completed the tutorial
      const { data } = await supabase
        .from('user_onboarding_preferences')
        .select('tutorial_completed')
        .eq('user_id', user.id)
        .single();

      const hasCompletedTutorial = data?.tutorial_completed || false;
      
      setTutorialState({
        isOpen: false,
        hasCompletedTutorial,
        loading: false,
      });

      // Show tutorial for new users who haven't completed it
      if (!hasCompletedTutorial) {
        // Small delay to ensure UI is ready
        setTimeout(() => {
          setTutorialState(prev => ({ ...prev, isOpen: true }));
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
      setTutorialState({
        isOpen: false,
        hasCompletedTutorial: false,
        loading: false,
      });
    }
  };

  const startTutorial = () => {
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

      setTutorialState({
        isOpen: false,
        hasCompletedTutorial: true,
        loading: false,
      });

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

      setTutorialState({
        isOpen: false,
        hasCompletedTutorial: false,
        loading: false,
      });

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