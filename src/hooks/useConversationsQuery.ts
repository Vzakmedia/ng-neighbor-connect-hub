/**
 * React Query-based conversations hook with offline persistence
 * Enables offline viewing of conversation list
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ConversationParticipant {
  user_id: string;
  profiles: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  conversation_participants: ConversationParticipant[];
  unread_count?: number;
}

/**
 * Fetch conversations for the current user
 */
const fetchConversations = async (userId: string): Promise<Conversation[]> => {
  const { data, error } = await supabase
    .from('direct_conversations')
    .select(`
      id,
      created_at,
      updated_at,
      last_message_at,
      last_message_preview,
      conversation_participants!inner(
        user_id,
        profiles(
          user_id,
          full_name,
          avatar_url
        )
      )
    `)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) throw error;

  // Filter to only include conversations where the user is a participant
  const userConversations = (data || []).filter(conv => 
    conv.conversation_participants.some(p => p.user_id === userId)
  );

  return userConversations as Conversation[];
};

/**
 * Fetch unread message counts per conversation
 */
const fetchUnreadCounts = async (userId: string): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('conversation_id')
    .eq('is_read', false)
    .neq('sender_id', userId);

  if (error) {
    console.warn('Failed to fetch unread counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  data?.forEach(msg => {
    counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
  });

  return counts;
};

/**
 * Hook to fetch conversations with offline persistence
 */
export function useConversationsQuery() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const [conversations, unreadCounts] = await Promise.all([
        fetchConversations(userId),
        fetchUnreadCounts(userId),
      ]);

      // Merge unread counts into conversations
      return conversations.map(conv => ({
        ...conv,
        unread_count: unreadCounts[conv.id] || 0,
      }));
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 7 * 24 * 60 * 60 * 1000, // Keep in cache for 7 days
    networkMode: 'offlineFirst',
    placeholderData: (previousData) => previousData,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook to get a single conversation by ID
 */
export function useConversationQuery(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          created_at,
          updated_at,
          last_message_at,
          last_message_preview,
          conversation_participants(
            user_id,
            profiles(
              user_id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data as Conversation;
    },
    enabled: !!conversationId && !!user,
    staleTime: 30 * 1000,
    gcTime: 60 * 60 * 1000, // 1 hour
    networkMode: 'offlineFirst',
    placeholderData: () => {
      // Try to find in conversations list cache
      const conversations = queryClient.getQueryData<Conversation[]>(['conversations', user?.id]);
      return conversations?.find(c => c.id === conversationId);
    },
  });
}

/**
 * Hook to create a new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (otherUserId: string): Promise<Conversation> => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if conversation already exists
      const { data: existingConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      const { data: otherParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId);

      const myConvIds = new Set(existingConversations?.map(p => p.conversation_id) || []);
      const existingConvId = otherParticipations?.find(p => myConvIds.has(p.conversation_id))?.conversation_id;

      if (existingConvId) {
        // Return existing conversation
        const { data, error } = await supabase
          .from('direct_conversations')
          .select(`
            id,
            created_at,
            updated_at,
            last_message_at,
            last_message_preview,
            conversation_participants(
              user_id,
              profiles(
                user_id,
                full_name,
                avatar_url
              )
            )
          `)
          .eq('id', existingConvId)
          .single();

        if (error) throw error;
        return data as Conversation;
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('direct_conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: otherUserId },
        ]);

      if (partError) throw partError;

      // Fetch complete conversation
      const { data, error } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          created_at,
          updated_at,
          last_message_at,
          last_message_preview,
          conversation_participants(
            user_id,
            profiles(
              user_id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', newConv.id)
        .single();

      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: (newConversation) => {
      // Add to conversations cache
      queryClient.setQueryData<Conversation[]>(
        ['conversations', user?.id],
        (old) => old ? [newConversation, ...old] : [newConversation]
      );
    },
  });
}

/**
 * Hook to mark messages as read
 */
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onMutate: async (conversationId) => {
      // Optimistically update unread count
      queryClient.setQueryData<Conversation[]>(
        ['conversations', user?.id],
        (old) => old?.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    },
    onSettled: () => {
      // Refetch to ensure accuracy
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
  });
}

/**
 * Get total unread count across all conversations
 */
export function useTotalUnreadCount() {
  const { data: conversations } = useConversationsQuery();
  
  return conversations?.reduce((total, conv) => total + (conv.unread_count || 0), 0) || 0;
}
