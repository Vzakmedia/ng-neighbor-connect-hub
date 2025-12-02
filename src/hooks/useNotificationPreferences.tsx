import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface NotificationCategories {
  safety_alerts: boolean;
  emergency_alerts: boolean;
  marketplace_updates: boolean;
  community_posts: boolean;
  service_bookings: boolean;
  messages: boolean;
  // Audio settings stored in categories
  audio_settings?: {
    soundEnabled: boolean;
    notificationVolume: number;
    emergencyVolume: number;
    notificationSound: string;
    messageChimeMode: 'single' | 'double';
    messageChimeVolume: number;
  };
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  priority_filter: 'low' | 'medium' | 'high' | 'critical';
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  email_digest: boolean;
  email_digest_frequency: 'daily' | 'weekly';
  categories: NotificationCategories;
  escalate_if_unread_minutes: number;
  escalate_min_severity: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES: NotificationCategories = {
  safety_alerts: true,
  emergency_alerts: true,
  marketplace_updates: true,
  community_posts: false,
  service_bookings: true,
  messages: true,
  audio_settings: {
    soundEnabled: true,
    notificationVolume: 0.5,
    emergencyVolume: 0.8,
    notificationSound: 'generated',
    messageChimeMode: 'single',
    messageChimeVolume: 0.7
  }
};

const DEFAULT_PREFERENCES: Partial<NotificationPreferences> = {
  in_app_enabled: true,
  push_enabled: true,
  email_enabled: true,
  sms_enabled: false,
  priority_filter: 'low',
  quiet_hours_start: null,
  quiet_hours_end: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  email_digest: false,
  email_digest_frequency: 'daily',
  categories: DEFAULT_CATEGORIES,
  escalate_if_unread_minutes: 0,
  escalate_min_severity: 'high'
};

// Cache for preference checks (to avoid repeated DB calls in notification store)
let cachedPreferences: NotificationPreferences | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getNotificationPreferencesCache = (): NotificationPreferences | null => {
  if (cachedPreferences && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedPreferences;
  }
  return null;
};

export const invalidatePreferencesCache = () => {
  cachedPreferences = null;
  cacheTimestamp = 0;
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch preferences from database
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Merge with defaults to ensure all fields exist
        const merged: NotificationPreferences = {
          ...DEFAULT_PREFERENCES,
          ...data,
          categories: {
            ...DEFAULT_CATEGORIES,
            ...(typeof data.categories === 'object' ? data.categories : {})
          }
        } as NotificationPreferences;
        
        setPreferences(merged);
        cachedPreferences = merged;
        cacheTimestamp = Date.now();
      } else {
        // Create default preferences for new user
        await createDefaultPreferences();
      }
    } catch (error) {
      console.error('[useNotificationPreferences] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create default preferences for a new user
  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const newPrefs = {
        user_id: user.id,
        ...DEFAULT_PREFERENCES
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(newPrefs)
        .select()
        .single();

      if (error) {
        // If conflict, just fetch existing
        if (error.code === '23505') {
          await fetchPreferences();
          return;
        }
        throw error;
      }

      if (data) {
        const merged = {
          ...DEFAULT_PREFERENCES,
          ...data,
          categories: {
            ...DEFAULT_CATEGORIES,
            ...(typeof data.categories === 'object' ? data.categories : {})
          }
        } as NotificationPreferences;
        
        setPreferences(merged);
        cachedPreferences = merged;
        cacheTimestamp = Date.now();
      }
    } catch (error) {
      console.error('[useNotificationPreferences] Create error:', error);
    }
  };

  // Update preferences
  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      // Optimistic update
      const optimisticUpdate = { ...preferences, ...updates };
      setPreferences(optimisticUpdate);
      cachedPreferences = optimisticUpdate;
      cacheTimestamp = Date.now();

      const { error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated."
      });
    } catch (error) {
      console.error('[useNotificationPreferences] Update error:', error);
      // Revert optimistic update
      await fetchPreferences();
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Update a specific category
  const updateCategory = async (category: keyof NotificationCategories, value: boolean | object) => {
    if (!preferences) return;

    const updatedCategories = {
      ...preferences.categories,
      [category]: value
    };

    await updatePreferences({ categories: updatedCategories });
  };

  // Update audio settings within categories
  const updateAudioSettings = async (audioUpdates: Partial<NotificationCategories['audio_settings']>) => {
    if (!preferences) return;

    const currentAudio = preferences.categories.audio_settings || DEFAULT_CATEGORIES.audio_settings;
    const updatedAudio = { ...currentAudio, ...audioUpdates };

    await updateCategory('audio_settings', updatedAudio);
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchPreferences();

    const channel = supabase
      .channel('notification_preferences_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_preferences',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[useNotificationPreferences] Real-time update:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const data = payload.new as any;
            const merged = {
              ...DEFAULT_PREFERENCES,
              ...data,
              categories: {
                ...DEFAULT_CATEGORIES,
                ...(typeof data.categories === 'object' ? data.categories : {})
              }
            } as NotificationPreferences;
            
            setPreferences(merged);
            cachedPreferences = merged;
            cacheTimestamp = Date.now();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPreferences]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    updateCategory,
    updateAudioSettings,
    refreshPreferences: fetchPreferences
  };
};

// Helper function to check if notifications should be shown
// This is used by notificationStore
export const shouldShowNotification = async (
  notificationType: string,
  priority: string
): Promise<{
  showInApp: boolean;
  playSound: boolean;
  showBrowserNotification: boolean;
}> => {
  // Try cache first
  let prefs = getNotificationPreferencesCache();
  
  // If no cache, fetch from DB
  if (!prefs) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { showInApp: true, playSound: true, showBrowserNotification: true };
      }

      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        prefs = {
          ...DEFAULT_PREFERENCES,
          ...data,
          categories: {
            ...DEFAULT_CATEGORIES,
            ...(typeof data.categories === 'object' ? data.categories : {})
          }
        } as NotificationPreferences;
        
        cachedPreferences = prefs;
        cacheTimestamp = Date.now();
      }
    } catch (error) {
      console.error('[shouldShowNotification] Error fetching preferences:', error);
      return { showInApp: true, playSound: true, showBrowserNotification: true };
    }
  }

  if (!prefs) {
    return { showInApp: true, playSound: true, showBrowserNotification: true };
  }

  // Check quiet hours
  const isInQuietHours = checkQuietHours(prefs);
  
  // Check if category is enabled
  const categoryEnabled = checkCategoryEnabled(prefs, notificationType);
  
  // Emergency notifications always get through (unless completely disabled)
  const isEmergency = notificationType.includes('emergency') || 
                      notificationType.includes('panic') ||
                      priority === 'urgent';

  // Get audio settings
  const audioSettings = prefs.categories.audio_settings || DEFAULT_CATEGORIES.audio_settings;
  const soundEnabled = audioSettings?.soundEnabled ?? true;

  return {
    showInApp: prefs.in_app_enabled && (categoryEnabled || isEmergency),
    playSound: soundEnabled && !isInQuietHours && (categoryEnabled || isEmergency),
    showBrowserNotification: prefs.push_enabled && (categoryEnabled || isEmergency)
  };
};

function checkQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quiet_hours_start || !prefs.quiet_hours_end) {
    return false;
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: prefs.timezone 
  });

  const start = prefs.quiet_hours_start;
  const end = prefs.quiet_hours_end;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }
  
  return currentTime >= start && currentTime < end;
}

function checkCategoryEnabled(prefs: NotificationPreferences, notificationType: string): boolean {
  const categories = prefs.categories;
  
  const typeMap: Record<string, string> = {
    'emergency': 'emergency_alerts',
    'panic_alert': 'emergency_alerts',
    'alert': 'safety_alerts',
    'safety_alert': 'safety_alerts',
    'message': 'messages',
    'direct_message': 'messages',
    'post': 'community_posts',
    'community_post': 'community_posts',
    'marketplace': 'marketplace_updates',
    'service': 'service_bookings',
    'booking': 'service_bookings'
  };

  const categoryKey = typeMap[notificationType] as keyof NotificationCategories | undefined;
  if (!categoryKey) return true; // Unknown types default to enabled
  
  const value = categories[categoryKey];
  return typeof value === 'boolean' ? value : true;
}

export default useNotificationPreferences;
