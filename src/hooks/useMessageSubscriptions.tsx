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

    console.log('Setting up message subscription for user:', userId, 'recipient:', recipientId);

    const filter = recipientId 
      ? `or(and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId}))`
      : `or(sender_id.eq.${userId},recipient_id.eq.${userId})`;

    console.log('Subscription filter:', filter);

    messageSubscriptionRef.current = createSafeSubscription(
      (channel) => channel
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
        }),
      {
        channelName: recipientId 
          ? `direct-messages-${userId}-${recipientId}`
          : `user-messages-${userId}`,
        onError: () => {
          console.log('Message subscription error - will retry with backoff');
          // Don't immediately refresh to avoid infinite loops
        },
        pollInterval: 5000, // More frequent polling for better real-time feel
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
        }),
      {
        channelName: `conversations-${userId}`,
        onError: () => {
          console.log('Conversation subscription error - will retry with backoff');
          // Don't immediately refresh to avoid infinite loops
        },
        pollInterval: 10000, // More frequent polling
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