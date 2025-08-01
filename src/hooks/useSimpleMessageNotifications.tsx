import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playNotification } from '@/utils/audioUtils';

// Simple message notification hook for debugging
export const useSimpleMessageNotifications = (userId: string | undefined) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log('useSimpleMessageNotifications: No userId provided');
      return;
    }

    console.log('useSimpleMessageNotifications: Setting up for user:', userId);

    const checkForNewMessages = async () => {
      console.log('useSimpleMessageNotifications: Checking for new messages...');
      
      try {
        const { data: messages, error } = await supabase
          .from('direct_messages')
          .select('id, sender_id, recipient_id, content, created_at')
          .eq('recipient_id', userId)
          .neq('sender_id', userId) // Exclude own messages
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('useSimpleMessageNotifications: Error fetching messages:', error);
          return;
        }

        console.log('useSimpleMessageNotifications: Latest message:', messages?.[0] || 'none');

        if (messages && messages.length > 0) {
          const latestMessage = messages[0];
          
          // Check if this is a new message we haven't seen before
          if (lastMessageId.current && lastMessageId.current !== latestMessage.id) {
            console.log('useSimpleMessageNotifications: NEW MESSAGE DETECTED!');
            console.log('Previous message ID:', lastMessageId.current);
            console.log('New message ID:', latestMessage.id);
            console.log('Message content:', latestMessage.content);
            
            // Play notification sound
            try {
              console.log('useSimpleMessageNotifications: Playing notification sound...');
              await playNotification('notification', 0.9);
              console.log('useSimpleMessageNotifications: Notification sound played successfully');
            } catch (audioError) {
              console.error('useSimpleMessageNotifications: Error playing notification:', audioError);
            }
          } else if (!lastMessageId.current) {
            console.log('useSimpleMessageNotifications: First check, setting baseline message ID');
          } else {
            console.log('useSimpleMessageNotifications: No new messages (same ID)');
          }
          
          lastMessageId.current = latestMessage.id;
        } else {
          console.log('useSimpleMessageNotifications: No messages found');
        }
      } catch (error) {
        console.error('useSimpleMessageNotifications: Unexpected error:', error);
      }
    };

    // Initial check
    checkForNewMessages();

    // Set up polling every 3 seconds
    intervalRef.current = setInterval(() => {
      console.log('useSimpleMessageNotifications: Polling interval triggered');
      checkForNewMessages();
    }, 3000);

    return () => {
      console.log('useSimpleMessageNotifications: Cleaning up');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId]);

  return {
    // Add a manual trigger function for testing
    triggerCheck: async () => {
      console.log('useSimpleMessageNotifications: Manual trigger called');
      // Reset last message ID to force notification on next check
      lastMessageId.current = null;
    }
  };
};