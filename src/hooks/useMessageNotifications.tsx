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
        console.error('Error checking for new messages:', error);
        return;
      }

      if (newMessages && newMessages.length > 0) {
        console.log(`Found ${newMessages.length} new messages since last check`);
        
        // Play notification sound for new messages
        for (const message of newMessages) {
          // Don't play notification if we're currently in the conversation with the sender
          if (currentConversationId) {
            // Get the conversation to check if it involves this sender
            const { data: conversation } = await supabase
              .from('direct_conversations')
              .select('user1_id, user2_id')
              .eq('id', currentConversationId)
              .single();
            
            if (conversation && 
                (conversation.user1_id === message.sender_id || conversation.user2_id === message.sender_id)) {
              console.log('Skipping notification - message is from current conversation');
              continue;
            }
          }
          
          try {
            await playNotification('notification', 0.8);
            console.log('Played notification sound for new message');
            break; // Only play one sound even if multiple messages
          } catch (error) {
            console.error('Error playing notification sound:', error);
          }
        }
      }

      lastCheckTimeRef.current = new Date();
    } catch (error) {
      console.error('Error in checkForNewMessages:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    console.log('Setting up message notification polling for user:', userId);
    
    // Initial check
    checkForNewMessages();
    
    // Set up polling every 5 seconds
    pollingIntervalRef.current = setInterval(checkForNewMessages, 5000);

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