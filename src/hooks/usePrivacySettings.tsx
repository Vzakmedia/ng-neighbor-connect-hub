import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PrivacySettings {
  profileVisibility: 'public' | 'neighbors' | 'verified' | 'private';
  showPhone: boolean;
  showAddress: boolean;
  shareLocation: boolean;
  showOnlineStatus: boolean;
  allowDMsFrom: 'everyone' | 'neighbors' | 'none';
  locationSharing: boolean;
}

export interface MessagingPreferences {
  allow_messages: boolean;
  show_read_receipts: boolean;
  show_online_status: boolean;
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'public',
  showPhone: false,
  showAddress: false,
  shareLocation: true,
  showOnlineStatus: true,
  allowDMsFrom: 'everyone',
  locationSharing: true,
};

const DEFAULT_MESSAGING_PREFERENCES: MessagingPreferences = {
  allow_messages: true,
  show_read_receipts: true,
  show_online_status: true,
};

export const usePrivacySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [messagingPreferences, setMessagingPreferences] = useState<MessagingPreferences>(DEFAULT_MESSAGING_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        // Fetch from user_settings
        const { data: userSettings, error: settingsError } = await supabase
          .from('user_settings')
          .select('privacy_settings')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error fetching user_settings:', settingsError);
        }

        if (userSettings?.privacy_settings) {
          setPrivacySettings({
            ...DEFAULT_PRIVACY_SETTINGS,
            ...userSettings.privacy_settings,
          });
        }

        // Fetch from messaging_preferences
        const { data: msgPrefs, error: msgError } = await supabase
          .from('messaging_preferences')
          .select('allow_messages, show_read_receipts, show_online_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (msgError && msgError.code !== 'PGRST116') {
          console.error('Error fetching messaging_preferences:', msgError);
        }

        if (msgPrefs) {
          setMessagingPreferences({
            allow_messages: msgPrefs.allow_messages ?? true,
            show_read_receipts: msgPrefs.show_read_receipts ?? true,
            show_online_status: msgPrefs.show_online_status ?? true,
          });
        }
      } catch (error) {
        console.error('Error fetching privacy settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (newSettings: Partial<PrivacySettings>) => {
    if (!user) return;

    setIsSaving(true);
    const updatedSettings = { ...privacySettings, ...newSettings };
    setPrivacySettings(updatedSettings);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          privacy_settings: updatedSettings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings.",
        variant: "destructive",
      });
      // Revert on error
      setPrivacySettings(privacySettings);
    } finally {
      setIsSaving(false);
    }
  }, [user, privacySettings, toast]);

  // Update messaging preferences
  const updateMessagingPreferences = useCallback(async (newPrefs: Partial<MessagingPreferences>) => {
    if (!user) return;

    setIsSaving(true);
    const updatedPrefs = { ...messagingPreferences, ...newPrefs };
    setMessagingPreferences(updatedPrefs);

    try {
      const { error } = await supabase
        .from('messaging_preferences')
        .upsert({
          user_id: user.id,
          ...updatedPrefs,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      // Also update in user_settings for consistency
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          privacy_settings: {
            ...privacySettings,
            showOnlineStatus: updatedPrefs.show_online_status,
          },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      toast({
        title: "Messaging preferences updated",
        description: "Your messaging settings have been saved.",
      });
    } catch (error) {
      console.error('Error saving messaging preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save messaging preferences.",
        variant: "destructive",
      });
      // Revert on error
      setMessagingPreferences(messagingPreferences);
    } finally {
      setIsSaving(false);
    }
  }, [user, messagingPreferences, privacySettings, toast]);

  return {
    privacySettings,
    messagingPreferences,
    isLoading,
    isSaving,
    updatePrivacySettings,
    updateMessagingPreferences,
  };
};
