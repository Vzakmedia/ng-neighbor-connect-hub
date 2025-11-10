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

    // Message subscriptions removed - handled by useDirectMessages broadcast channel
    // This prevents double subscriptions and infinite loops

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
      unsubscribeConversations();
      unsubscribeReadReceipts();
    };
  }, [userId, onConversation, onReadReceiptEvent, onConversationUpdate, onReadReceipt]);

  // Return empty methods for backward compatibility
  return {
    cleanup: () => {},
    setupMessageSubscription: () => {},
    setupConversationSubscription: () => {},
    setupReadReceiptSubscription: () => {}
  };
};