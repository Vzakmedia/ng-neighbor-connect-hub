import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
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

      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchUnreadCount();

    // Set up real-time subscription for conversation updates
    const conversationChannel = supabase
      .channel('conversation-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_conversations',
        filter: `user1_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_conversations',
        filter: `user2_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    // Set up real-time subscription for new messages
    const messageChannel = supabase
      .channel('message-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [user]);

  return unreadCount;
};