import { useEffect } from 'react';
import { useRealtimeContext } from '@/contexts/RealtimeContext';
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
  const { onMessage, onConversation, onReadReceipt: onReadReceiptEvent } = useRealtimeContext();

  useEffect(() => {
    if (!userId) return;

    console.log('[MessageSubscriptions] Using unified subscriptions for user:', userId, 'recipient:', recipientId);

    // Subscribe to message events
    const unsubscribeMessages = onMessage((payload) => {
      // Filter messages for the current conversation if recipientId is specified
      const message = payload.new as Message;
      
      if (recipientId) {
        const isRelevant = 
          (message.sender_id === userId && message.recipient_id === recipientId) ||
          (message.sender_id === recipientId && message.recipient_id === userId);
        
        if (!isRelevant) return;
      }

      // Parse attachments
      if (message.attachments && typeof message.attachments === 'string') {
        try {
          message.attachments = JSON.parse(message.attachments as any);
        } catch (e) {
          console.error('Error parsing attachments:', e);
          message.attachments = [];
        }
      }

      if (payload.eventType === 'INSERT') {
        console.log('New message received via unified subscription:', message);
        onNewMessage(message);
      } else if (payload.eventType === 'UPDATE') {
        console.log('Message updated via unified subscription:', message);
        onMessageUpdate(message);
      }
    });

    // Subscribe to conversation events
    const unsubscribeConversations = onConversationUpdate 
      ? onConversation((payload) => {
          console.log('Conversation change via unified subscription:', payload.eventType);
          onConversationUpdate();
        })
      : () => {};

    // Subscribe to read receipt events
    const unsubscribeReadReceipts = onReadReceipt
      ? onReadReceiptEvent((messageId) => {
          console.log('Read receipt received via unified subscription:', messageId);
          onReadReceipt(messageId);
        })
      : () => {};

    return () => {
      unsubscribeMessages();
      unsubscribeConversations();
      unsubscribeReadReceipts();
    };
  }, [userId, recipientId, onMessage, onConversation, onReadReceiptEvent, onNewMessage, onMessageUpdate, onConversationUpdate, onReadReceipt]);

  // Return empty methods for backward compatibility
  return {
    cleanup: () => {},
    setupMessageSubscription: () => {},
    setupConversationSubscription: () => {},
    setupReadReceiptSubscription: () => {}
  };
};