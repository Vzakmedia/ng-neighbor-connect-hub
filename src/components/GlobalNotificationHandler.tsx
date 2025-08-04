import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createSafeSubscription } from '@/utils/realtimeUtils';
import { playNotification } from '@/utils/audioUtils';

export const GlobalNotificationHandler = () => {
  const { user } = useAuth();
  const windowHasFocusRef = useRef(true);
  const isInitializedRef = useRef(false);

  console.log('GlobalNotificationHandler initialized:', { 
    userExists: !!user, 
    userId: user?.id 
  });

  useEffect(() => {
    if (!user) return;

    // Track window focus state for notification sound
    const handleFocus = () => {
      windowHasFocusRef.current = true;
    };
    
    const handleBlur = () => {
      windowHasFocusRef.current = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Listen for new messages to play notification sounds
    const messageSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}`
        }, (payload) => {
          console.log('New message notification received:', payload);
          
          // Only play notification if window has focus and it's not the initial load
          if (windowHasFocusRef.current && isInitializedRef.current) {
            try {
              // Get audio settings from localStorage
              const audioSettings = JSON.parse(localStorage.getItem('audioSettings') || '{}');
              const soundEnabled = audioSettings.soundEnabled !== false; // Default to true
              
              if (soundEnabled) {
                console.log('Playing notification sound for new message');
                playNotification('notification');
              } else {
                console.log('Sound disabled in settings');
              }
            } catch (error) {
              console.error('Error playing notification sound:', error);
            }
          }
        }),
      {
        channelName: 'global-message-notifications',
        onError: () => console.log('Global notification subscription error'),
        pollInterval: 60000,
        debugName: 'GlobalNotificationHandler-messages'
      }
    );

    // Mark as initialized after a short delay to prevent initial load notifications
    setTimeout(() => {
      isInitializedRef.current = true;
      console.log('GlobalNotificationHandler: Initialization complete, notifications enabled');
    }, 2000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      messageSubscription?.unsubscribe();
    };
  }, [user]);

  return null; // This component doesn't render anything
};