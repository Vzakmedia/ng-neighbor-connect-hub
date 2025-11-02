import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMessageQueue } from './useMessageQueue';
import { useConnectionStatus } from './useConnectionStatus';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  status: MessageStatus;
  optimistic?: boolean;
  attachments?: Array<{
    id: string;
    type: 'image' | 'video' | 'file';
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
}

export const useDirectMessages = (userId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { 
    queue, 
    addToQueue, 
    removeFromQueue, 
    updateRetryCount,
    getRetryableMessages 
  } = useMessageQueue(userId);
  const { status: connectionStatus } = useConnectionStatus();

  // Auto-retry queued messages when connection is restored
  useEffect(() => {
    if (connectionStatus === 'connected' && queue.length > 0) {
      const retryableMessages = getRetryableMessages();
      retryableMessages.forEach(queuedMsg => {
        retryQueuedMessage(queuedMsg.tempId, queuedMsg.content, queuedMsg.recipientId);
      });
    }
  }, [connectionStatus]);

  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!userId) {
      console.log('No userId provided to fetchMessages');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching messages between', userId, 'and', otherUserId);
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Map the database response to our Message interface
      const mappedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        created_at: msg.created_at,
        status: msg.status as 'sent' | 'delivered' | 'read',
        attachments: Array.isArray(msg.attachments) 
          ? msg.attachments as Array<{
              id: string;
              type: 'image' | 'video' | 'file';
              name: string;
              url: string;
              size: number;
              mimeType: string;
            }>
          : []
      }));
      
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Could not load messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const sendMessage = useCallback(async (content: string, recipientId: string, tempId?: string) => {
    if (!userId || !content.trim()) return false;

    // Create optimistic message
    const optimisticId = tempId || `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      content: content.trim(),
      sender_id: userId,
      recipient_id: recipientId,
      created_at: new Date().toISOString(),
      status: 'sending',
      optimistic: true,
    };

    // Add optimistic message immediately for instant feedback (if not already there)
    if (!tempId) {
      setMessages(prev => [...prev, optimisticMessage]);
    } else {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'sending' as MessageStatus } : msg
        )
      );
    }

    try {
      setLoading(true);
      const { data: message, error } = await supabase
        .from('direct_messages')
        .insert({
          content: content.trim(),
          sender_id: userId,
          recipient_id: recipientId,
          status: 'sent'
        })
        .select()
        .single();

      if (error) throw error;

      // Remove from queue if it was queued
      if (tempId) {
        removeFromQueue(tempId);
      }

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId 
            ? { ...message, status: 'sent' as MessageStatus }
            : msg
        )
      );

      // Create notification for the recipient
      if (message) {
        try {
          await supabase.functions.invoke('notification-service', {
            body: {
              userId: recipientId,
              title: 'New Message',
              body: `${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
              type: 'message',
              data: {
                messageId: message.id,
                senderId: userId
              }
            }
          });
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark optimistic message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId 
            ? { ...msg, status: 'failed' as MessageStatus }
            : msg
        )
      );

      // Add to queue for retry
      if (!tempId) {
        addToQueue({
          tempId: optimisticId,
          content: content.trim(),
          recipientId,
          timestamp: Date.now(),
          retryCount: 0
        });
      } else {
        updateRetryCount(tempId);
      }
      
      toast({
        title: "Message failed",
        description: connectionStatus === 'offline' 
          ? "No internet. Message will retry when online."
          : "Tap the message to retry.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, toast, addToQueue, removeFromQueue, updateRetryCount, connectionStatus]);

  const retryMessage = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.status !== 'failed') return false;

    return sendMessage(message.content, message.recipient_id, messageId);
  }, [messages, sendMessage]);

  const retryQueuedMessage = useCallback(async (tempId: string, content: string, recipientId: string) => {
    return sendMessage(content, recipientId, tempId);
  }, [sendMessage]);

  const sendMessageWithAttachments = useCallback(async (
    content: string, 
    recipientId: string, 
    attachments: Array<{
      id: string;
      type: 'image' | 'video' | 'file';
      name: string;
      url: string;
      size: number;
      mimeType: string;
    }> = []
  ) => {
    if (!userId || (!content.trim() && attachments.length === 0)) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          content: content.trim() || '',
          sender_id: userId,
          recipient_id: recipientId,
          status: 'sent',
          attachments: attachments
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message with attachments:', error);
      toast({
        title: "Error",
        description: "Could not send message.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase.rpc('mark_message_as_read', {
        message_id: messageId
      });
      
      if (error) {
        console.error('Error marking message as read:', error);
        return false;
      }
      
      // Update local state immediately
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'read' as const }
            : msg
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }, []);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase.rpc('mark_direct_messages_as_read', {
        conversation_id: conversationId,
        current_user_id: userId
      });
      
      if (error) {
        console.error('Error marking conversation as read:', error);
        return false;
      }
      
      // Update local message states to 'read' for messages we received
      setMessages(prev => 
        prev.map(msg => 
          msg.recipient_id === userId 
            ? { ...msg, status: 'read' as const }
            : msg
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return false;
    }
  }, [userId]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Remove any optimistic version of this message
      const filtered = prev.filter(msg => 
        !(msg.optimistic && msg.sender_id === message.sender_id && msg.content === message.content)
      );
      
      // Check if real message already exists
      const messageExists = filtered.some(msg => msg.id === message.id);
      if (messageExists) {
        // Update existing message
        return filtered.map(msg => msg.id === message.id ? message : msg);
      }
      
      // Add new message and sort by created_at to maintain order
      const newMessages = [...filtered, message];
      return newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }, []);

  const updateMessage = useCallback((updatedMessage: Message) => {
    setMessages(prev => 
      prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
    );
  }, []);

  return {
    messages,
    loading,
    fetchMessages,
    sendMessage,
    sendMessageWithAttachments,
    markMessageAsRead,
    markConversationAsRead,
    addMessage,
    updateMessage,
    setMessages,
    retryMessage,
    queuedMessagesCount: queue.length
  };
};