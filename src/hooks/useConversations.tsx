import { useState, useCallback, useRef, useEffect } from 'react';
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
  request_status?: 'pending' | 'accepted' | 'declined';
}

export const useConversations = (userId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const toastRef = useRef(toast);
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_COOLDOWN_MS = 500;
  const conversationsRef = useRef<Conversation[]>([]);

  // Update toast ref when it changes
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Circuit breaker to prevent runaway fetching
  const failureCountRef = useRef(0);
  const MAX_FAILURES = 3;
  const isCircuitOpenRef = useRef(false);

  // Step 5: Stabilize fetchConversations - only depend on userId
  const fetchConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!userId) {
      console.log('No userId provided to fetchConversations');
      setConversations([]);
      setLoading(false);
      return [];
    }

    // Circuit breaker check
    if (isCircuitOpenRef.current) {
      console.log('Circuit breaker open - skipping fetch');
      return [];
    }

    // Debounce to prevent rapid successive calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS) {
      console.log('Skipping fetch - cooldown active, returning cached conversations');
      return conversationsRef.current; // ✅ Return cached data instead of empty array
    }
    lastFetchTimeRef.current = now;

    try {
      setLoading(true);
      console.time('fetchConversations');
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
          updated_at,
          request_status
        `)
        .eq('conversation_type', 'direct_message')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      // Filter out pending requests where the current user is the recipient
      // Pending requests where current user is sender (user1) should still be visible (as "Pending")
      // Pending requests where current user is recipient (user2) should only appear in "Message Requests"
      const filteredData = (data || []).filter(conv =>
        !(conv.user2_id === userId && conv.request_status === 'pending')
      );

      // Fetch user profiles separately using secure function
      const userIds = [...new Set(filteredData.flatMap(conv => [conv.user1_id, conv.user2_id]))];

      // Use the secure get_public_profile_info function for each user
      const profilePromises = userIds.map(id =>
        supabase.rpc('get_public_profile_info', { target_user_id: id })
      );

      const profileResults = await Promise.all(profilePromises);

      // Create profile map from results
      const profileMap = new Map(
        profileResults
          .filter(result => result.data && result.data.length > 0)
          .map(result => {
            const profile = result.data[0]; // RPC returns array, take first item
            return [profile.user_id, {
              user_id: profile.user_id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              phone: null // phone is not included in public profile info for security
            }];
          })
      );

      const formattedConversations = filteredData.map(conv => {
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

      // ✅ Update ref immediately before setting state
      conversationsRef.current = formattedConversations;

      // Optimized comparison - check length and key fields only
      setConversations(prev => {
        if (prev.length !== formattedConversations.length) {
          return formattedConversations;
        }

        // Quick check: compare IDs and timestamps only
        const hasChanges = prev.some((conv, i) =>
          conv.id !== formattedConversations[i]?.id ||
          conv.last_message_at !== formattedConversations[i]?.last_message_at ||
          conv.user1_has_unread !== formattedConversations[i]?.user1_has_unread ||
          conv.user2_has_unread !== formattedConversations[i]?.user2_has_unread
        );

        if (!hasChanges) {
          return prev; // Same reference = no re-render
        }

        return formattedConversations;
      });
      console.timeEnd('fetchConversations');

      // Reset failure count on success
      failureCountRef.current = 0;

      return formattedConversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.timeEnd('fetchConversations');
      setConversations([]); // Set empty array on error to prevent infinite loading

      return [];

      // Increment failure count and open circuit breaker if needed
      failureCountRef.current++;
      if (failureCountRef.current >= MAX_FAILURES) {
        isCircuitOpenRef.current = true;
        console.error('Circuit breaker opened - too many failures');
        setTimeout(() => {
          isCircuitOpenRef.current = false;
          failureCountRef.current = 0;
          console.log('Circuit breaker reset');
        }, 30000); // Reset after 30 seconds
      }

      // Only show toast for actual errors, not connection issues
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message;
        if (!errorMessage.includes('timeout') && !errorMessage.includes('network') && !errorMessage.includes('Failed to fetch')) {
          toastRef.current({
            title: "Error",
            description: "Could not load conversations.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [userId]); // Fix 1: Only depend on userId - toast is now in ref


  const createOrFindConversation = useCallback(async (
    recipientId: string,
    options?: {
      conversationType?: 'direct_message' | 'marketplace';
      marketplaceItemId?: string;
      marketplaceServiceId?: string;
    }
  ): Promise<string | null> => {
    if (!userId) return null;

    try {
      // Use the RPC function to create or find conversation
      const { data: conversationId, error } = await supabase.rpc(
        'create_conversation_with_request_check',
        {
          _sender_id: userId,
          _recipient_id: recipientId,
          _conversation_type: options?.conversationType || 'direct_message',
          _marketplace_item_id: options?.marketplaceItemId || null,
          _marketplace_service_id: options?.marketplaceServiceId || null,
        }
      );

      if (error) throw error;
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toastRef.current({
        title: "Error",
        description: "Could not create conversation.",
        variant: "destructive",
      });
      return null;
    }
  }, [userId]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return;

    try {
      // Optimistically update local state immediately
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

      // Then update database in background
      await supabase.rpc('mark_direct_messages_as_read', {
        conversation_id: conversationId,
        current_user_id: userId
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      // Don't revert - user already sees it as read, no need to cause a flash
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