import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playNotification } from '@/utils/audioUtils';

// Direct notification implementation - no complex hooks
export const setupDirectMessageNotifications = (userId: string): (() => void) => {
  console.log('=== SETTING UP DIRECT MESSAGE NOTIFICATIONS ===');
  console.log('User ID:', userId);
  
  let intervalId: NodeJS.Timeout | null = null;
  let lastMessageTimestamp: string | null = null;
  
  const checkForNewMessages = async () => {
    console.log('Direct notifications: Checking for new messages...');
    console.log('Last timestamp:', lastMessageTimestamp);
    
    try {
      // Get the most recent message for this user
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('id, sender_id, recipient_id, content, created_at')
        .eq('recipient_id', userId)
        .neq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Direct notifications: Database error:', error);
        return;
      }
      
      console.log('Direct notifications: Query result:', messages);
      
      if (messages && messages.length > 0) {
        const latestMessage = messages[0];
        console.log('Direct notifications: Latest message timestamp:', latestMessage.created_at);
        
        // Check if this is newer than our last known message
        if (lastMessageTimestamp && latestMessage.created_at > lastMessageTimestamp) {
          console.log('=== NEW MESSAGE DETECTED ===');
          console.log('Message content:', latestMessage.content);
          console.log('From:', latestMessage.sender_id);
          
          // Play notification sound
          try {
            console.log('Direct notifications: Playing sound...');
            await playNotification('notification', 1.0);
            console.log('Direct notifications: Sound played successfully');
          } catch (audioError) {
            console.error('Direct notifications: Audio error:', audioError);
          }
        } else if (!lastMessageTimestamp) {
          console.log('Direct notifications: First check - setting baseline');
        } else {
          console.log('Direct notifications: No new messages');
        }
        
        lastMessageTimestamp = latestMessage.created_at;
      } else {
        console.log('Direct notifications: No messages found');
      }
    } catch (error) {
      console.error('Direct notifications: Unexpected error:', error);
    }
  };
  
  // Initial check after a short delay
  setTimeout(checkForNewMessages, 1000);
  
  // Start polling every 2 seconds
  intervalId = setInterval(checkForNewMessages, 2000);
  console.log('Direct notifications: Polling started');
  
  // Return cleanup function
  return () => {
    console.log('Direct notifications: Cleaning up');
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
};