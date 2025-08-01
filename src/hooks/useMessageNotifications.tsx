import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playNotification } from '@/utils/audioUtils';

interface UseMessageNotificationsProps {
  userId: string | undefined;
  currentConversationId?: string;
}

export const useMessageNotifications = ({ userId, currentConversationId }: UseMessageNotificationsProps) => {
  const lastMessageCountRef = useRef<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTimeRef = useRef<Date>(new Date());

  const checkForNewMessages = async () => {
    if (!userId) return;

    console.log('useMessageNotifications: Checking for new messages for user:', userId);
    console.log('useMessageNotifications: Current conversation ID:', currentConversationId);
    console.log('useMessageNotifications: Last check time:', lastCheckTimeRef.current);

    try {
      // Check for messages received in the last 30 seconds
      const thirtySecondsAgo = new Date(Date.now() - 30000);
      
      const { data: newMessages, error } = await supabase
        .from('direct_messages')
        .select('id, sender_id, recipient_id, created_at, content')
        .eq('recipient_id', userId)
        .neq('sender_id', userId) // Don't notify for own messages
        .gte('created_at', lastCheckTimeRef.current.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useMessageNotifications: Error checking for new messages:', error);
        return;
      }

      console.log('useMessageNotifications: Found messages:', newMessages?.length || 0);
      
      if (newMessages && newMessages.length > 0) {
        console.log('useMessageNotifications: New messages found:', newMessages);
        
        // Play notification sound for new messages
        for (const message of newMessages) {
          console.log('useMessageNotifications: Processing message from sender:', message.sender_id);
          
          // Don't play notification if we're currently in the conversation with the sender
          if (currentConversationId) {
            console.log('useMessageNotifications: Checking if message is from current conversation...');
            // Get the conversation to check if it involves this sender
            const { data: conversation } = await supabase
              .from('direct_conversations')
              .select('user1_id, user2_id')
              .eq('id', currentConversationId)
              .single();
            
            if (conversation && 
                (conversation.user1_id === message.sender_id || conversation.user2_id === message.sender_id)) {
              console.log('useMessageNotifications: Skipping notification - message is from current conversation');
              continue;
            }
          }
          
          console.log('useMessageNotifications: Playing notification sound...');
          try {
            await playNotification('notification', 0.8);
            console.log('useMessageNotifications: Successfully played notification sound for new message');
            break; // Only play one sound even if multiple messages
          } catch (error) {
            console.error('useMessageNotifications: Error playing notification sound:', error);
          }
        }
      } else {
        console.log('useMessageNotifications: No new messages found');
      }

      lastCheckTimeRef.current = new Date();
      console.log('useMessageNotifications: Updated last check time to:', lastCheckTimeRef.current);
    } catch (error) {
      console.error('useMessageNotifications: Error in checkForNewMessages:', error);
    }
  };

  useEffect(() => {
    if (!userId) {
      console.log('useMessageNotifications: No userId provided, skipping setup');
      return;
    }

    console.log('useMessageNotifications: Setting up message notification polling for user:', userId);
    console.log('useMessageNotifications: Current conversation ID:', currentConversationId);
    
    // Initial check
    checkForNewMessages();
    
    // Set up polling every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      console.log('useMessageNotifications: Polling interval triggered');
      checkForNewMessages();
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [userId, currentConversationId]);

  // Manual trigger for immediate notification check
  const triggerNotificationCheck = () => {
    checkForNewMessages();
  };

  return {
    triggerNotificationCheck
  };
};