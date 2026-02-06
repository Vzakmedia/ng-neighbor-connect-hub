import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeContext } from '@/contexts/RealtimeContext';

export const useReadStatus = () => {
  const { user } = useAuth();
  const { onCommunityPost, onMessage, onConversation, onAlert } = useRealtimeContext();
  const [unreadCounts, setUnreadCounts] = useState({
    community: 0,
    messages: 0,
    notifications: 0,
  });

  useEffect(() => {
    if (!user) return;

    loadUnreadCounts();

    console.log('[ReadStatus] Using unified real-time subscriptions');

    // Subscribe to community post events
    const unsubscribeCommunity = onCommunityPost(() => {
      loadCommunityUnreadCount();
    });

    // Subscribe to message events
    const unsubscribeMessages = onMessage(() => {
      loadMessagesUnreadCount();
    });

    // Subscribe to conversation events
    const unsubscribeConversations = onConversation(() => {
      loadMessagesUnreadCount();
    });

    // Subscribe to alert notification events
    const unsubscribeAlerts = onAlert(() => {
      loadNotificationsUnreadCount();
    });

    return () => {
      unsubscribeCommunity();
      unsubscribeMessages();
      unsubscribeConversations();
      unsubscribeAlerts();
    };
  }, [user, onCommunityPost, onMessage, onConversation, onAlert]);

  const loadUnreadCounts = async () => {
    await Promise.all([
      loadCommunityUnreadCount(),
      loadMessagesUnreadCount(),
      loadNotificationsUnreadCount(),
    ]);
  };

  const loadCommunityUnreadCount = async () => {
    try {
      // Changed to use board posts count for "Groups" tab instead of community feed
      const { data, error } = await supabase.rpc('get_unread_board_posts_count');
      if (error) throw error;
      setUnreadCounts(prev => ({ ...prev, community: data || 0 }));
    } catch (error) {
      console.error('Error loading community/groups unread count:', error);
      // Fallback or ignore error
    }
  };

  const loadMessagesUnreadCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_unread_messages_count');
      if (error) throw error;
      setUnreadCounts(prev => ({ ...prev, messages: data || 0 }));
    } catch (error) {
      console.error('Error loading messages unread count:', error);
    }
  };

  const loadNotificationsUnreadCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_unread_notifications_count');
      if (error) throw error;
      setUnreadCounts(prev => ({ ...prev, notifications: data || 0 }));
    } catch (error) {
      console.error('Error loading notifications unread count:', error);
    }
  };

  const markCommunityPostAsRead = async (postId: string) => {
    try {
      const { error } = await supabase.rpc('mark_community_post_as_read', { target_post_id: postId });
      if (error) throw error;
      // Don't refresh count here - let the caller handle batched refreshes
    } catch (error) {
      console.error('Error marking community post as read:', error);
    }
  };

  const markBoardPostAsRead = async (postId: string) => {
    try {
      const { error } = await supabase.rpc('mark_board_post_as_read', { target_post_id: postId });
      if (error) throw error;
    } catch (error) {
      console.error('Error marking board post as read:', error);
    }
  };

  const markAllCommunityPostsAsRead = async () => {
    try {
      const { error } = await supabase.rpc('mark_all_community_posts_as_read');
      if (error) throw error;
      setUnreadCounts(prev => ({ ...prev, community: 0 }));
    } catch (error) {
      console.error('Error marking all community posts as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_as_read');
      if (error) throw error;
      setUnreadCounts(prev => ({ ...prev, notifications: 0 }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const checkIfPostIsRead = async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('post_read_status')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if post is read:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('Error checking if post is read:', error);
      return false;
    }
  };

  const checkIfBoardPostIsRead = async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('board_post_read_status')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if board post is read:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('Error checking if board post is read:', error);
      return false;
    }
  };

  return {
    unreadCounts,
    markCommunityPostAsRead,
    markBoardPostAsRead,
    markAllCommunityPostsAsRead,
    markAllNotificationsAsRead,
    checkIfPostIsRead,
    checkIfBoardPostIsRead,
    refreshUnreadCounts: loadUnreadCounts,
  };
};