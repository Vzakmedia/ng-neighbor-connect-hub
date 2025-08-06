import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useSimpleNotifications';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user) return;

    // Subscribe to new direct messages
    const messageChannel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        async (payload) => {
          const message = payload.new;
          
          // Get sender info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', message.sender_id)
            .single();

          addNotification({
            id: message.id,
            type: 'message',
            title: 'New Message',
            body: `${senderProfile?.full_name || 'Someone'} sent you a message`,
            data: { 
              senderId: message.sender_id,
              messageId: message.id,
              type: 'direct_message'
            },
            timestamp: message.created_at,
            isRead: false,
            priority: 'normal'
          });
        }
      )
      .subscribe();

    // Subscribe to new community posts
    const communityChannel = supabase
      .channel('new-community-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts'
        },
        async (payload) => {
          const post = payload.new;
          
          // Only notify if it's not the user's own post
          if (post.user_id === user.id) return;
          
          // Get author info
          const { data: authorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', post.user_id)
            .single();

          addNotification({
            id: post.id,
            type: 'alert',
            title: 'New Community Post',
            body: `${authorProfile?.full_name || 'Someone'} posted: ${post.title || post.content?.substring(0, 50)}...`,
            data: { 
              postId: post.id,
              authorId: post.user_id,
              type: 'community_post'
            },
            timestamp: post.created_at,
            isRead: false,
            priority: 'low'
          });
        }
      )
      .subscribe();

    // Subscribe to emergency alerts
    const emergencyChannel = supabase
      .channel('emergency-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'safety_alerts'
        },
        async (payload) => {
          const alert = payload.new;
          
          // Only notify if it's not the user's own alert
          if (alert.user_id === user.id) return;
          
          addNotification({
            id: alert.id,
            type: 'emergency',
            title: '🚨 Emergency Alert',
            body: alert.title || 'Emergency alert in your area',
            data: { 
              alertId: alert.id,
              alertType: alert.alert_type,
              type: 'emergency_alert'
            },
            timestamp: alert.created_at,
            isRead: false,
            priority: 'urgent'
          });
        }
      )
      .subscribe();

    // Subscribe to panic alerts
    const panicChannel = supabase
      .channel('panic-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'panic_alerts'
        },
        async (payload) => {
          const alert = payload.new;
          
          // Only notify if it's not the user's own alert
          if (alert.user_id === user.id) return;
          
          addNotification({
            id: alert.id,
            type: 'panic_alert',
            title: '🆘 PANIC ALERT',
            body: 'Someone needs immediate help in your area!',
            data: { 
              alertId: alert.id,
              situationType: alert.situation_type,
              type: 'panic_alert'
            },
            timestamp: alert.created_at,
            isRead: false,
            priority: 'urgent'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(communityChannel);
      supabase.removeChannel(emergencyChannel);
      supabase.removeChannel(panicChannel);
    };
  }, [user, addNotification]);

  return {};
};