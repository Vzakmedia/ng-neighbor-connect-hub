import { useState, useCallback, useEffect, useRef } from 'react';
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
  delivered_at?: string | null;
  read_at?: string | null;
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
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const { toast } = useToast();
  const { 
    queue, 
    addToQueue, 
    removeFromQueue, 
    updateRetryCount,
    getRetryableMessages 
  } = useMessageQueue(userId);
  const { status: connectionStatus } = useConnectionStatus();
  
  // Message cache for last 50 messages per conversation
  const messageCache = useRef<Map<string, Message[]>>(new Map());
  const broadcastChannelRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const lastSyncTimestampRef = useRef<Map<string, string>>(new Map());
  const activeConversationIdRef = useRef<string | null>(null);

  // Update messagesRef whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-retry queued messages when connection is restored
  useEffect(() => {
    if (connectionStatus === 'connected' && queue.length > 0) {
      const retryableMessages = getRetryableMessages();
      retryableMessages.forEach(queuedMsg => {
        retryQueuedMessage(queuedMsg.tempId, queuedMsg.content, queuedMsg.recipientId);
      });
    }
  }, [connectionStatus]);

  const fetchMessages = useCallback(async (otherUserId: string, useCache: boolean = true) => {
    if (!userId) {
      console.log('No userId provided to fetchMessages');
      setLoading(false);
      return;
    }
    
    // Check cache first
    const cacheKey = [userId, otherUserId].sort().join('-');
    if (useCache && messageCache.current.has(cacheKey)) {
      const cached = messageCache.current.get(cacheKey)!;
      setMessages(cached);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching messages between', userId, 'and', otherUserId);
      
      // Mobile optimization: Load fewer messages initially (20 vs 50)
      const isMobile = window.innerWidth < 768;
      const initialLimit = isMobile ? 20 : 50;
      
      // Fetch only last N messages initially for performance
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(initialLimit);

      if (error) throw error;
      
      // Check if there are more messages
      setHasMoreMessages((data || []).length === initialLimit);
      
      // Map the database response to our Message interface
      const mappedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        created_at: msg.created_at,
        status: msg.status as 'sent' | 'delivered' | 'read',
        delivered_at: msg.delivered_at,
        read_at: msg.read_at,
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
      })).reverse(); // Reverse to get chronological order
      
      // Update cache (keep only last 50)
      messageCache.current.set(cacheKey, mappedMessages);
      
      // Store last sync timestamp for this conversation
      if (mappedMessages.length > 0) {
        const latestTimestamp = mappedMessages[mappedMessages.length - 1].created_at;
        lastSyncTimestampRef.current.set(cacheKey, latestTimestamp);
      }
      
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

  const fetchOlderMessages = useCallback(async (otherUserId: string) => {
    if (!userId || messages.length === 0 || loadingOlder || !hasMoreMessages) {
      return;
    }
    
    try {
      setLoadingOlder(true);
      const oldestMessage = messages[0];
      
      // Mobile optimization: Load fewer messages (20 vs 50)
      const isMobile = window.innerWidth < 768;
      const loadLimit = isMobile ? 20 : 50;
      
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(loadLimit);

      if (error) throw error;
      
      // Check if there are more messages
      setHasMoreMessages((data || []).length === loadLimit);
      
      const mappedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        created_at: msg.created_at,
        status: msg.status as 'sent' | 'delivered' | 'read',
        delivered_at: msg.delivered_at,
        read_at: msg.read_at,
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
      })).reverse();
      
      // Prepend older messages
      setMessages(prev => [...mappedMessages, ...prev]);
      
      // Update cache
      const cacheKey = [userId, otherUserId].sort().join('-');
      messageCache.current.set(cacheKey, [...mappedMessages, ...messages]);
      
    } catch (error) {
      console.error('Error fetching older messages:', error);
      toast({
        title: "Error",
        description: "Could not load older messages.",
        variant: "destructive",
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [userId, messages, loadingOlder, hasMoreMessages, toast]);

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

      // Add to queue for retry with normal priority
      if (!tempId) {
        addToQueue({
          tempId: optimisticId,
          content: content.trim(),
          recipientId,
          timestamp: Date.now(),
          retryCount: 0,
          priority: 'normal',
          nextRetryAt: Date.now() + 1000
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

  // Fetch missed messages since last sync (for reconnection)
  const fetchMissedMessages = useCallback(async (otherUserId: string) => {
    if (!userId) return [];

    const cacheKey = [userId, otherUserId].sort().join('-');
    const lastSyncTimestamp = lastSyncTimestampRef.current.get(cacheKey);
    
    if (!lastSyncTimestamp) {
      console.log('[fetchMissedMessages] No last sync timestamp, skipping');
      return [];
    }

    try {
      console.log('[fetchMissedMessages] Fetching messages after:', lastSyncTimestamp);
      
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .gt('created_at', lastSyncTimestamp)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const missedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        created_at: msg.created_at,
        status: msg.status as MessageStatus,
        delivered_at: msg.delivered_at,
        read_at: msg.read_at,
        attachments: msg.attachments || []
      }));

      if (missedMessages.length > 0) {
        console.log(`[fetchMissedMessages] Found ${missedMessages.length} missed messages`);
        
        // Add missed messages to state
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = missedMessages.filter(m => !existingIds.has(m.id));
          return [...prev, ...newMessages];
        });

        // Update last sync timestamp
        const latestTimestamp = missedMessages[missedMessages.length - 1].created_at;
        lastSyncTimestampRef.current.set(cacheKey, latestTimestamp);
      }

      return missedMessages;
    } catch (error) {
      console.error('[fetchMissedMessages] Error:', error);
      return [];
    }
  }, [userId]);

  // Pull missed messages on reconnection
  const wasOfflineRef = useRef(false);
  useEffect(() => {
    const wasOffline = wasOfflineRef.current;
    const isNowOnline = connectionStatus === 'connected';
    
    // If we just came back online and have an active conversation, pull missed messages
    if (wasOffline && isNowOnline && activeConversationIdRef.current) {
      const otherUserId = activeConversationIdRef.current;
      console.log('[useDirectMessages] Reconnected - fetching missed messages for:', otherUserId);
      fetchMissedMessages(otherUserId);
    }
    
    // Update the offline state
    wasOfflineRef.current = connectionStatus !== 'connected';
  }, [connectionStatus, fetchMissedMessages]);

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
      const message = messages.find(m => m.id === messageId);
      if (!message) return false;
      
      // Update local state immediately for instant feedback
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'read' as const }
            : msg
        )
      );
      
      // Broadcast read receipt instantly via realtime (no DB write needed)
      if (broadcastChannelRef.current) {
        await broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'read_receipt',
          payload: { 
            messageId, 
            recipientId: message.sender_id,
            readBy: userId 
          }
        });
      }
      
      // Update DB in background (for persistence)
      const { error } = await supabase.rpc('mark_message_as_read', {
        message_id: messageId
      });
      
      if (error) {
        console.error('Error marking message as read:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }, [messages, userId]);

  const markConversationAsRead = useCallback(async (conversationId: string, otherUserId?: string) => {
    if (!userId) return false;
    
    try {
      // Update local message states immediately for instant feedback
      setMessages(prev => 
        prev.map(msg => 
          msg.recipient_id === userId 
            ? { ...msg, status: 'read' as const }
            : msg
        )
      );
      
      // Use messagesRef instead of messages to avoid dependency
      const unreadMessages = messagesRef.current.filter(m => 
        m.recipient_id === userId && m.status !== 'read'
      );
      
      if (broadcastChannelRef.current && unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          await broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'read_receipt',
            payload: { 
              messageId: msg.id, 
              recipientId: msg.sender_id,
              readBy: userId 
            }
          });
        }
      }
      
      // Update DB in background
      const { error } = await supabase.rpc('mark_direct_messages_as_read', {
        conversation_id: conversationId,
        current_user_id: userId
      });
      
      if (error) {
        console.error('Error marking conversation as read:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return false;
    }
  }, [userId]);

  const markMessagesAsDelivered = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Mark all 'sent' messages to this user as 'delivered'
      const { data: updatedCount, error } = await supabase.rpc('mark_messages_delivered', {
        recipient_user_id: userId
      });
      
      if (error) {
        console.error('Error marking messages as delivered:', error);
        return;
      }
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.recipient_id === userId && msg.status === 'sent'
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );
      
      // Broadcast delivery receipts to senders
      const deliveredMessages = messagesRef.current.filter(
        m => m.recipient_id === userId && m.status === 'sent'
      );
      
      if (broadcastChannelRef.current && deliveredMessages.length > 0) {
        for (const msg of deliveredMessages) {
          await broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'delivery_receipt',
            payload: { messageId: msg.id, deliveredTo: userId }
          });
        }
      }
      
      console.log(`Marked ${updatedCount} messages as delivered`);
    } catch (error) {
      console.error('Error in markMessagesAsDelivered:', error);
    }
  }, [userId]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Deduplication: Check if message already exists (by ID or optimistic match)
      const messageExists = prev.some(msg => 
        msg.id === message.id || 
        (msg.optimistic && msg.sender_id === message.sender_id && msg.content === message.content && 
         Math.abs(new Date(msg.created_at).getTime() - new Date(message.created_at).getTime()) < 5000) // Within 5 seconds
      );
      
      if (messageExists) {
        // Update existing message (replace optimistic with real)
        return prev.map(msg => 
          msg.id === message.id || 
          (msg.optimistic && msg.sender_id === message.sender_id && msg.content === message.content)
            ? { ...message, optimistic: false }
            : msg
        );
      }
      
      // Add new message - append to end for performance (already sorted by DB query)
      return [...prev, message];
    });
  }, []);

  const updateMessage = useCallback((updatedMessage: Message) => {
    setMessages(prev => 
      prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
    );
  }, []);

  // Setup broadcast channel for instant read receipts and delivery receipts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`read-receipts:${userId}`)
      .on('broadcast', { event: 'read_receipt' }, (payload: any) => {
        const { messageId, readBy } = payload.payload;
        
        // Only update if we're the sender of the message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId && msg.sender_id === userId
              ? { ...msg, status: 'read' as const }
              : msg
          )
        );
      })
      .on('broadcast', { event: 'delivery_receipt' }, (payload: any) => {
        const { messageId } = payload.payload;
        
        // Only update if we're the sender of the message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId && msg.sender_id === userId
              ? { ...msg, status: 'delivered' as const }
              : msg
          )
        );
      })
      .subscribe();

    broadcastChannelRef.current = channel;

    return () => {
      if (broadcastChannelRef.current) {
        supabase.removeChannel(broadcastChannelRef.current);
        broadcastChannelRef.current = null;
      }
    };
  }, [userId]);

  // Setup postgres_changes subscription for real-time message delivery
  useEffect(() => {
    if (!userId) return;

    console.log('[useDirectMessages] Setting up postgres_changes subscription for user:', userId);

    const messagesChannel = supabase
      .channel(`direct-messages-changes:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          console.log('[useDirectMessages] New message received:', payload);
          const newMessage = payload.new as any;
          addMessage({
            id: newMessage.id,
            content: newMessage.content,
            sender_id: newMessage.sender_id,
            recipient_id: newMessage.recipient_id,
            created_at: newMessage.created_at,
            status: newMessage.status as MessageStatus,
            delivered_at: newMessage.delivered_at,
            read_at: newMessage.read_at,
            attachments: newMessage.attachments || []
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          console.log('[useDirectMessages] Message updated (as recipient):', payload);
          const updatedMessage = payload.new as any;
          updateMessage({
            id: updatedMessage.id,
            content: updatedMessage.content,
            sender_id: updatedMessage.sender_id,
            recipient_id: updatedMessage.recipient_id,
            created_at: updatedMessage.created_at,
            status: updatedMessage.status as MessageStatus,
            delivered_at: updatedMessage.delivered_at,
            read_at: updatedMessage.read_at,
            attachments: updatedMessage.attachments || []
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${userId}`
        },
        (payload) => {
          console.log('[useDirectMessages] Message updated (as sender):', payload);
          const updatedMessage = payload.new as any;
          updateMessage({
            id: updatedMessage.id,
            content: updatedMessage.content,
            sender_id: updatedMessage.sender_id,
            recipient_id: updatedMessage.recipient_id,
            created_at: updatedMessage.created_at,
            status: updatedMessage.status as MessageStatus,
            delivered_at: updatedMessage.delivered_at,
            read_at: updatedMessage.read_at,
            attachments: updatedMessage.attachments || []
          });
        }
      )
      .subscribe((status) => {
        console.log('[useDirectMessages] Subscription status:', status);
      });

    return () => {
      console.log('[useDirectMessages] Cleaning up postgres_changes subscription');
      supabase.removeChannel(messagesChannel);
    };
  }, [userId, addMessage, updateMessage]);

  return {
    messages,
    loading,
    loadingOlder,
    hasMoreMessages,
    fetchMessages,
    fetchOlderMessages,
    fetchMissedMessages,
    sendMessage,
    sendMessageWithAttachments,
    markMessageAsRead,
    markConversationAsRead,
    addMessage,
    updateMessage,
    setMessages,
    retryMessage,
    markMessagesAsDelivered,
    queuedMessagesCount: queue.length,
    broadcastChannelRef,
    setActiveConversationId: (id: string | null) => {
      activeConversationIdRef.current = id;
    }
  };
};