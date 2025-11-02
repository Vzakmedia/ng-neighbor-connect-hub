import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from './useDirectMessages';

interface UseMessageSubscriptionsProps {
  userId: string | undefined;
  onNewMessage: (message: Message) => void;
  onMessageUpdate: (message: Message) => void;
  onConversationUpdate?: () => void;
  recipientId?: string; // For direct message dialogs
  activeConversationId?: string; // For main messaging interface
  onReadReceipt?: (messageId: string) => void; // For broadcast read receipts
}

export const useMessageSubscriptions = ({
  userId,
  onNewMessage,
  onMessageUpdate,
  onConversationUpdate,
  recipientId,
  activeConversationId,
  onReadReceipt
}: UseMessageSubscriptionsProps) => {
  const messageChannelRef = useRef<any>(null);
  const conversationChannelRef = useRef<any>(null);
  const readReceiptChannelRef = useRef<any>(null);

  const setupMessageSubscription = useCallback(() => {
    if (!userId || messageChannelRef.current) return;

    console.log('Setting up message subscription for user:', userId, 'recipient:', recipientId);

    const filter = recipientId 
      ? `or(and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId}))`
      : `or(sender_id.eq.${userId},recipient_id.eq.${userId})`;

    console.log('Subscription filter:', filter);

    try {
      const channel = supabase
        .channel(`messages:${userId}:${recipientId || 'all'}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter
        }, (payload) => {
          console.log('New message received via subscription:', payload);
          const newMessage = payload.new as Message;
          // Ensure attachments are properly parsed
          if (newMessage.attachments && typeof newMessage.attachments === 'string') {
            try {
              newMessage.attachments = JSON.parse(newMessage.attachments as any);
            } catch (e) {
              console.error('Error parsing attachments:', e);
              newMessage.attachments = [];
            }
          }
          onNewMessage(newMessage);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter
        }, (payload) => {
          console.log('Message updated via subscription:', payload);
          const updatedMessage = payload.new as Message;
          // Ensure attachments are properly parsed
          if (updatedMessage.attachments && typeof updatedMessage.attachments === 'string') {
            try {
              updatedMessage.attachments = JSON.parse(updatedMessage.attachments as any);
            } catch (e) {
              console.error('Error parsing attachments:', e);
              updatedMessage.attachments = [];
            }
          }
          onMessageUpdate(updatedMessage);
        })
        .subscribe((status) => {
          console.log('Message subscription status:', status);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.log('Message subscription error - triggering message fetch');
            if (onConversationUpdate) {
              onConversationUpdate();
            }
          }
        });

      messageChannelRef.current = channel;
    } catch (error) {
      console.error('Error setting up message subscription:', error);
    }
  }, [userId, recipientId, onNewMessage, onMessageUpdate, onConversationUpdate]);

  const setupConversationSubscription = useCallback(() => {
    if (!userId || !onConversationUpdate || conversationChannelRef.current) return;

    console.log('Setting up conversation subscription for user:', userId);

    try {
      const channel = supabase
        .channel(`conversations:${userId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_conversations',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`
        }, () => {
          console.log('Conversation updated via subscription');
          onConversationUpdate();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_conversations',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`
        }, () => {
          console.log('New conversation created via subscription');
          onConversationUpdate();
        })
        .subscribe((status) => {
          console.log('Conversation subscription status:', status);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.log('Conversation subscription error - triggering conversation refresh');
            onConversationUpdate();
          }
        });

      conversationChannelRef.current = channel;
    } catch (error) {
      console.error('Error setting up conversation subscription:', error);
    }
  }, [userId, onConversationUpdate]);

  const setupReadReceiptSubscription = useCallback(() => {
    if (!userId || !onReadReceipt || readReceiptChannelRef.current) return;

    console.log('Setting up read receipt broadcast for user:', userId);

    try {
      const channel = supabase
        .channel(`read-receipts:${userId}`)
        .on('broadcast', { event: 'read_receipt' }, (payload: any) => {
          console.log('Read receipt received:', payload);
          const { messageId } = payload.payload;
          if (messageId) {
            onReadReceipt(messageId);
          }
        })
        .subscribe((status) => {
          console.log('Read receipt subscription status:', status);
        });

      readReceiptChannelRef.current = channel;
    } catch (error) {
      console.error('Error setting up read receipt subscription:', error);
    }
  }, [userId, onReadReceipt]);

  const cleanup = useCallback(() => {
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
      messageChannelRef.current = null;
    }
    if (conversationChannelRef.current) {
      supabase.removeChannel(conversationChannelRef.current);
      conversationChannelRef.current = null;
    }
    if (readReceiptChannelRef.current) {
      supabase.removeChannel(readReceiptChannelRef.current);
      readReceiptChannelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (userId) {
      setupMessageSubscription();
      setupConversationSubscription();
      setupReadReceiptSubscription();
    }

    return cleanup;
  }, [userId, setupMessageSubscription, setupConversationSubscription, setupReadReceiptSubscription, cleanup]);

  return {
    cleanup,
    setupMessageSubscription,
    setupConversationSubscription,
    setupReadReceiptSubscription
  };
};