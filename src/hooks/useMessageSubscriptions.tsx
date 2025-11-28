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
      if (payload.eventType === 'INSERT' && payload.new) {
        const msg = payload.new;
        console.log('[MessageSubscriptions] Message event received:', msg.id, 'sender:', msg.sender_id, 'recipient:', msg.recipient_id);
        
        // Only process if this message is relevant to the active conversation
        if (recipientId) {
          // For direct message dialogs
          const isRelevant = (msg.sender_id === recipientId && msg.recipient_id === userId) || 
                            (msg.sender_id === userId && msg.recipient_id === recipientId);
          if (isRelevant) {
            console.log('[MessageSubscriptions] Calling onNewMessage for relevant message');
            onNewMessage(msg);
          }
        } else if (activeConversationId) {
          // For main messaging interface - check if message belongs to active conversation
          const isRelevant = (msg.sender_id === userId || msg.recipient_id === userId);
          if (isRelevant && msg.sender_id !== userId) {
            console.log('[MessageSubscriptions] Calling onNewMessage for active conversation');
            onNewMessage(msg);
          }
        }
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
  }, [userId, onMessage, onConversation, onReadReceiptEvent, onConversationUpdate, onReadReceipt, onNewMessage, recipientId, activeConversationId]);

  // Return empty methods for backward compatibility
  return {
    cleanup: () => {},
    setupMessageSubscription: () => {},
    setupConversationSubscription: () => {},
    setupReadReceiptSubscription: () => {}
  };
};