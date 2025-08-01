import { supabase } from '@/integrations/supabase/client';

// Centralized Supabase operations to reduce duplication

export const supabaseOperations = {
  // RPC operations
  rpc: {
    markMessageAsRead: (messageId: string) =>
      supabase.rpc('mark_message_as_read', { message_id: messageId }),

    markDirectMessagesAsRead: (conversationId: string, currentUserId: string) =>
      supabase.rpc('mark_direct_messages_as_read', {
        conversation_id: conversationId,
        current_user_id: currentUserId
      }),

    deleteMessages: (messageIds: string[]) =>
      supabase.rpc('delete_messages', { message_ids: messageIds }),

    softDeleteMessages: (messageIds: string[]) =>
      supabase.rpc('soft_delete_messages', { message_ids: messageIds }),

    deleteConversation: (conversationId: string) =>
      supabase.rpc('delete_conversation', { conversation_id: conversationId }),

    markAllNotificationsAsRead: () =>
      supabase.rpc('mark_all_notifications_as_read'),

    logSecurityEvent: (eventType: string, details: any, severity: string = 'info') =>
      supabase.rpc('log_security_event', {
        _action_type: eventType,
        _resource_type: 'security',
        _details: details,
        _risk_level: severity
      }),

    logStaffActivity: (activityType: string, description: string) =>
      supabase.rpc('log_staff_activity', {
        _action_type: activityType,
        _resource_type: 'staff',
        _details: { description }
      }),

    getUnreadCommunityPostsCount: () =>
      supabase.rpc('get_unread_community_posts_count'),

    getUnreadMessagesCount: () =>
      supabase.rpc('get_unread_messages_count'),

    getUnreadNotificationsCount: () =>
      supabase.rpc('get_unread_notifications_count'),

    markCommunityPostAsRead: (postId: string) =>
      supabase.rpc('mark_community_post_as_read', { target_post_id: postId }),

    markBoardPostAsRead: (postId: string) =>
      supabase.rpc('mark_board_post_as_read', { target_post_id: postId }),

    markAllCommunityPostsAsRead: () =>
      supabase.rpc('mark_all_community_posts_as_read'),
  },

  // Common table operations
  tables: {
    // Direct messages
    directMessages: {
      fetchBetweenUsers: (userId: string, otherUserId: string) =>
        supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
          .order('created_at', { ascending: true }),

      insert: (message: {
        content: string;
        sender_id: string;
        recipient_id: string;
        status: 'sent' | 'delivered' | 'read';
        attachments?: any;
      }) =>
        supabase.from('direct_messages').insert(message),

      delete: (messageId: string) =>
        supabase.from('direct_messages').delete().eq('id', messageId),
    },

    // Profiles
    profiles: {
      getById: (userId: string) =>
        supabase.from('profiles').select('*').eq('user_id', userId).single(),

      getByIds: (userIds: string[]) =>
        supabase.from('profiles').select('*').in('user_id', userIds),

      count: () =>
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
    },

    // Conversations
    directConversations: {
      getForUser: (userId: string) =>
        supabase
          .from('direct_conversations')
          .select(`
            *,
            user1:profiles!direct_conversations_user1_id_fkey(user_id, full_name, avatar_url),
            user2:profiles!direct_conversations_user2_id_fkey(user_id, full_name, avatar_url)
          `)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .order('updated_at', { ascending: false }),

      findBetweenUsers: (userId: string, recipientId: string) =>
        supabase
          .from('direct_conversations')
          .select('id')
          .or(`and(user1_id.eq.${userId},user2_id.eq.${recipientId}),and(user1_id.eq.${recipientId},user2_id.eq.${userId})`)
          .single(),

      create: (userId: string, recipientId: string) =>
        supabase
          .from('direct_conversations')
          .insert({
            user1_id: userId,
            user2_id: recipientId,
          })
          .select('id')
          .single(),
    },
  },

  // Utility functions
  utils: {
    handleSupabaseError: (error: any, defaultMessage: string = 'An error occurred'): string => {
      if (!error) return defaultMessage;
      return error.message || error.error_description || defaultMessage;
    },

    formatSupabaseResponse: <T>(data: T[] | null): T[] => {
      return data || [];
    },
  },
};

export default supabaseOperations;