import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useReadStatus = () => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({
    community: 0,
    messages: 0,
    notifications: 0,
  });

  useEffect(() => {
    if (!user) return;

    loadUnreadCounts();
    
    // Set up real-time subscriptions for updates with error handling
    let communitySubscription: any;
    let messagesSubscription: any;
    let notificationsSubscription: any;
    let pollInterval: NodeJS.Timeout;

    const setupPolling = () => {
      // Polling disabled to prevent constant refreshes
      console.log('Polling disabled for useReadStatus to prevent refresh loops');
    };

    try {
      communitySubscription = supabase
        .channel('community-posts-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, () => {
          loadCommunityUnreadCount();
        })
        .subscribe((status) => {
          console.log('Community subscription status:', status);
          if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to community posts - falling back to polling');
            setupPolling();
          }
        });

      messagesSubscription = supabase
        .channel('messages-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, () => {
          loadMessagesUnreadCount();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_conversations' }, () => {
          loadMessagesUnreadCount();
        })
        .subscribe((status) => {
          console.log('Messages subscription status:', status);
          if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to messages - falling back to polling');
            setupPolling();
          }
        });

      notificationsSubscription = supabase
        .channel('notifications-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alert_notifications' }, () => {
          loadNotificationsUnreadCount();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alert_notifications' }, () => {
          loadNotificationsUnreadCount();
        })
        .subscribe((status) => {
          console.log('Notifications subscription status:', status);
          if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to notifications - falling back to polling');
            setupPolling();
          }
        });
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
      setupPolling();
    }

    return () => {
      try {
        if (communitySubscription) {
          supabase.removeChannel(communitySubscription);
        }
        if (messagesSubscription) {
          supabase.removeChannel(messagesSubscription);
        }
        if (notificationsSubscription) {
          supabase.removeChannel(notificationsSubscription);
        }
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error cleaning up subscriptions:', error);
      }
    };
  }, [user]);

  const loadUnreadCounts = async () => {
    await Promise.all([
      loadCommunityUnreadCount(),
      loadMessagesUnreadCount(),
      loadNotificationsUnreadCount(),
    ]);
  };

  const loadCommunityUnreadCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_unread_community_posts_count');
      if (error) throw error;
      setUnreadCounts(prev => ({ ...prev, community: data || 0 }));
    } catch (error) {
      console.error('Error loading community unread count:', error);
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
      loadCommunityUnreadCount(); // Refresh count
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