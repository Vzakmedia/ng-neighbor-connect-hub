import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type LocationFilterScope = 'neighborhood' | 'city' | 'state' | 'all';

interface LocationPreferences {
  default_location_filter: LocationFilterScope;
}

export const useLocationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<LocationPreferences>({
    default_location_filter: 'neighborhood'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  // Listen for preference changes from other components
  useEffect(() => {
    const handlePreferenceChange = (event: CustomEvent) => {
      setPreferences(prev => ({
        ...prev,
        default_location_filter: event.detail.defaultFilter
      }));
    };

    window.addEventListener('locationFilterPreferenceChanged', handlePreferenceChange as EventListener);
    return () => {
      window.removeEventListener('locationFilterPreferenceChanged', handlePreferenceChange as EventListener);
    };
  }, []);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: existingPrefs, error: fetchError } = await supabase
        .from('user_onboarding_preferences')
        .select('default_location_filter')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching location preferences:', fetchError);
        return;
      }

      if (existingPrefs) {
        setPreferences({
          default_location_filter: (existingPrefs.default_location_filter as LocationFilterScope) || 'neighborhood'
        });
      } else {
        // Create default preferences if they don't exist
        await createDefaultPreferences();
      }
    } catch (error) {
      console.error('Error fetching location preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_onboarding_preferences')
        .upsert(
          {
            user_id: user.id,
            default_location_filter: 'neighborhood'
          },
          {
            onConflict: 'user_id'
          }
        );

      if (error) {
        console.error('Error creating default preferences:', error);
      }
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  const updateLocationFilter = async (filterScope: LocationFilterScope) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_onboarding_preferences')
        .upsert(
          {
            user_id: user.id,
            default_location_filter: filterScope,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id'
          }
        );

      if (error) {
        console.error('Error updating location filter:', error);
        return false;
      }

      setPreferences({ default_location_filter: filterScope });
      
      // Trigger event to notify other components
      window.dispatchEvent(new CustomEvent('locationFilterPreferenceChanged', {
        detail: { defaultFilter: filterScope }
      }));

      return true;
    } catch (error) {
      console.error('Error updating location filter:', error);
      return false;
    }
  };

  return {
    preferences,
    loading,
    updateLocationFilter,
    refetch: fetchPreferences
  };
};