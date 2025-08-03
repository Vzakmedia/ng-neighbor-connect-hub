import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  user1_has_unread: boolean;
  user2_has_unread: boolean;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_phone: string | null;
}

export const useConversations = (userId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      console.log('No userId provided to fetchConversations');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching conversations for user:', userId);
      const { data, error } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          last_message_at,
          user1_has_unread,
          user2_has_unread,
          created_at,
          updated_at
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set((data || []).flatMap(conv => [conv.user1_id, conv.user2_id]))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, phone')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const formattedConversations = (data || []).map(conv => {
        const isUser1 = conv.user1_id === userId;
        const otherUserId = isUser1 ? conv.user2_id : conv.user1_id;
        const otherUser = profileMap.get(otherUserId);
        
        return {
          ...conv,
          other_user_id: otherUserId,
          other_user_name: otherUser?.full_name || 'Unknown User',
          other_user_avatar: otherUser?.avatar_url || null,
          other_user_phone: otherUser?.phone || null,
        };
      });

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Could not load conversations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const createOrFindConversation = useCallback(async (recipientId: string): Promise<string | null> => {
    if (!userId) return null;

    try {
      // Find existing conversation
      const { data: existingConversation } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${recipientId}),and(user1_id.eq.${recipientId},user2_id.eq.${userId})`)
        .maybeSingle();

      if (existingConversation) {
        return existingConversation.id;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('direct_conversations')
        .insert({
          user1_id: userId,
          user2_id: recipientId
        })
        .select('id')
        .single();

      if (error) throw error;
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Could not create conversation.",
        variant: "destructive",
      });
      return null;
    }
  }, [userId, toast]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return;

    try {
      await supabase.rpc('mark_direct_messages_as_read', {
        conversation_id: conversationId,
        current_user_id: userId
      });
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? {
                ...conv,
                user1_has_unread: conv.user1_id === userId ? false : conv.user1_has_unread,
                user2_has_unread: conv.user2_id === userId ? false : conv.user2_has_unread
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [userId]);

  return {
    conversations,
    loading,
    fetchConversations,
    createOrFindConversation,
    markConversationAsRead,
    setConversations
  };
};