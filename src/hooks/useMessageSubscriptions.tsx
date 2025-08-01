import { useEffect, useRef, useCallback } from 'react';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import type { Message } from './useDirectMessages';

interface UseMessageSubscriptionsProps {
  userId: string | undefined;
  onNewMessage: (message: Message) => void;
  onMessageUpdate: (message: Message) => void;
  onConversationUpdate?: () => void;
  recipientId?: string; // For direct message dialogs
  activeConversationId?: string; // For main messaging interface
}

export const useMessageSubscriptions = ({
  userId,
  onNewMessage,
  onMessageUpdate,
  onConversationUpdate,
  recipientId,
  activeConversationId
}: UseMessageSubscriptionsProps) => {
  const messageSubscriptionRef = useRef<any>(null);
  const conversationSubscriptionRef = useRef<any>(null);

  const setupMessageSubscription = useCallback(() => {
    if (!userId || messageSubscriptionRef.current) return;

    const filter = recipientId 
      ? `or(and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId}))`
      : `or(sender_id.eq.${userId},recipient_id.eq.${userId})`;

    messageSubscriptionRef.current = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter
        }, (payload) => {
          const newMessage = payload.new as Message;
          onNewMessage(newMessage);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter
        }, (payload) => {
          const updatedMessage = payload.new as Message;
          onMessageUpdate(updatedMessage);
        }),
      {
        channelName: recipientId 
          ? `direct-messages-${userId}-${recipientId}`
          : `user-messages-${userId}`,
        onError: () => {
          console.error('Message subscription error');
          onConversationUpdate?.();
        },
        pollInterval: 30000,
        debugName: recipientId ? 'DirectMessageDialog-messages' : 'MessagingContent-messages'
      }
    );
  }, [userId, recipientId, onNewMessage, onMessageUpdate, onConversationUpdate]);

  const setupConversationSubscription = useCallback(() => {
    if (!userId || !onConversationUpdate || conversationSubscriptionRef.current) return;

    conversationSubscriptionRef.current = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_conversations',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`
        }, () => {
          onConversationUpdate();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_conversations',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`
        }, () => {
          onConversationUpdate();
        }),
      {
        channelName: `conversations-${userId}`,
        onError: () => {
          console.error('Conversation subscription error');
          onConversationUpdate();
        },
        pollInterval: 30000,
        debugName: 'MessagingContent-conversations'
      }
    );
  }, [userId, onConversationUpdate]);

  const cleanup = useCallback(() => {
    if (messageSubscriptionRef.current) {
      cleanupSafeSubscription(messageSubscriptionRef.current);
      messageSubscriptionRef.current = null;
    }
    if (conversationSubscriptionRef.current) {
      cleanupSafeSubscription(conversationSubscriptionRef.current);
      conversationSubscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (userId) {
      setupMessageSubscription();
      setupConversationSubscription();
    }

    return cleanup;
  }, [userId, setupMessageSubscription, setupConversationSubscription, cleanup]);

  return {
    cleanup,
    setupMessageSubscription,
    setupConversationSubscription
  };
};