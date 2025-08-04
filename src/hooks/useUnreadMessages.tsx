import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { playNotification } from '@/utils/audioUtils';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const previousCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const windowHasFocusRef = useRef(true);

  console.log('useUnreadMessages hook initialized:', { 
    userExists: !!user, 
    userId: user?.id,
    currentUnreadCount: unreadCount 
  });

  const fetchUnreadCount = async (isFromRealtime = false) => {
    console.log('fetchUnreadCount called:', { isFromRealtime, userExists: !!user });
    
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    try {
      // Count unread messages from direct_conversations
      const { data: conversations, error } = await supabase
        .from('direct_conversations')
        .select('user1_id, user2_id, user1_has_unread, user2_has_unread')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      let totalUnread = 0;
      conversations?.forEach(conv => {
        if (conv.user1_id === user.id && conv.user1_has_unread) {
          totalUnread++;
        } else if (conv.user2_id === user.id && conv.user2_has_unread) {
          totalUnread++;
        }
      });

      // Only play notification sound for genuine new messages
      const shouldPlayNotification = 
        totalUnread > previousCountRef.current && // Count increased
        !isInitialLoadRef.current && // Not the initial load
        windowHasFocusRef.current; // Only when window has focus

      console.log('Notification check:', {
        totalUnread,
        previousCount: previousCountRef.current,
        isInitialLoad: isInitialLoadRef.current,
        isFromRealtime,
        windowHasFocus: windowHasFocusRef.current,
        shouldPlayNotification
      });

      if (shouldPlayNotification) {
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
      
      // Update refs
      previousCountRef.current = totalUnread;
      
      // Mark initial load as complete
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
      
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Track window focus state
    const handleFocus = () => {
      windowHasFocusRef.current = true;
    };
    
    const handleBlur = () => {
      windowHasFocusRef.current = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initial fetch
    fetchUnreadCount();

    // Set up safe real-time subscriptions
    const conversationSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'direct_conversations',
          filter: `user1_id=eq.${user.id}`
        }, () => {
          fetchUnreadCount(true); // Mark as from realtime
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'direct_conversations',
          filter: `user2_id=eq.${user.id}`
        }, () => {
          fetchUnreadCount(true); // Mark as from realtime
        }),
      {
        channelName: 'conversation-updates',
        onError: fetchUnreadCount,
        pollInterval: 120000, // Poll every 2 minutes for unread count (reduced from 30s)
        debugName: 'useUnreadMessages-conversations'
      }
    );

    const messageSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}`
        }, () => {
          fetchUnreadCount(true); // Mark as from realtime
        }),
      {
        channelName: 'message-updates',
        onError: fetchUnreadCount,
        pollInterval: 60000, // Poll every 1 minute for new messages (reduced from 15s)
        debugName: 'useUnreadMessages-messages'
      }
    );

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      conversationSubscription?.unsubscribe();
      messageSubscription?.unsubscribe();
    };
  }, [user]);

  return unreadCount;
};