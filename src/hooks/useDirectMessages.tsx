import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMessageQueue } from "./useMessageQueue";
import { useConnectionStatus } from "./useConnectionStatus";

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

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
    type: "image" | "video" | "file";
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
  const { queue, addToQueue, removeFromQueue, updateRetryCount, getRetryableMessages } = useMessageQueue(userId);
  const { status: connectionStatus } = useConnectionStatus();

  const messageCache = useRef<Map<string, Message[]>>(new Map());
  const broadcastChannelRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const lastSyncTimestampRef = useRef<Map<string, string>>(new Map());
  const activeConversationIdRef = useRef<string | null>(null);
  const wasOfflineRef = useRef(false);

  // Update messagesRef whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-retry queued messages when connection is restored
  useEffect(() => {
    if (connectionStatus === "connected" && queue.length > 0) {
      const retryableMessages = getRetryableMessages();
      retryableMessages.forEach((msg) => retryQueuedMessage(msg.tempId, msg.content, msg.recipientId));
    }
  }, [connectionStatus]);

  // -------------------------------
  // Fetch messages (with cache)
  // -------------------------------
  const fetchMessages = useCallback(
    async (otherUserId: string, useCache: boolean = true) => {
      if (!userId) return;

      const cacheKey = [userId, otherUserId].sort().join("-");
      if (useCache && messageCache.current.has(cacheKey)) {
        setMessages(messageCache.current.get(cacheKey)!);
        return;
      }

      try {
        setLoading(true);
        const isMobile = window.innerWidth < 768;
        const limit = isMobile ? 20 : 50;

        const { data, error } = await supabase
          .from("direct_messages")
          .select("*")
          .or(
            `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`,
          )
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        const mappedMessages = (data || [])
          .map((msg) => ({
            id: msg.id,
            content: msg.content,
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
            created_at: msg.created_at,
            status: msg.status as MessageStatus,
            delivered_at: msg.delivered_at,
            read_at: msg.read_at,
            attachments: msg.attachments || [],
          }))
          .reverse();

        messageCache.current.set(cacheKey, mappedMessages);

        if (mappedMessages.length > 0) {
          lastSyncTimestampRef.current.set(cacheKey, mappedMessages[mappedMessages.length - 1].created_at);
        }

        setMessages(mappedMessages);
        setHasMoreMessages(mappedMessages.length === limit);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not load messages.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [userId, toast],
  );

  // -------------------------------
  // Fetch older messages
  // -------------------------------
  const fetchOlderMessages = useCallback(
    async (otherUserId: string) => {
      if (!userId || messages.length === 0 || loadingOlder || !hasMoreMessages) return;

      try {
        setLoadingOlder(true);
        const oldest = messages[0];
        const isMobile = window.innerWidth < 768;
        const limit = isMobile ? 20 : 50;

        const { data, error } = await supabase
          .from("direct_messages")
          .select("*")
          .or(
            `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`,
          )
          .lt("created_at", oldest.created_at)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        const olderMessages = (data || [])
          .map((msg) => ({
            id: msg.id,
            content: msg.content,
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
            created_at: msg.created_at,
            status: msg.status as MessageStatus,
            delivered_at: msg.delivered_at,
            read_at: msg.read_at,
            attachments: msg.attachments || [],
          }))
          .reverse();

        setMessages((prev) => [...olderMessages, ...prev]);

        const cacheKey = [userId, otherUserId].sort().join("-");
        messageCache.current.set(cacheKey, [...olderMessages, ...messages]);
        setHasMoreMessages(olderMessages.length === limit);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not load older messages.", variant: "destructive" });
      } finally {
        setLoadingOlder(false);
      }
    },
    [userId, messages, loadingOlder, hasMoreMessages, toast],
  );

  // -------------------------------
  // Optimistic message sending
  // -------------------------------
  const sendMessage = useCallback(
    async (content: string, recipientId: string, tempId?: string) => {
      if (!userId || !content.trim()) return false;

      const optimisticId = tempId || `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        content: content.trim(),
        sender_id: userId,
        recipient_id: recipientId,
        created_at: new Date().toISOString(),
        status: "sending",
        optimistic: true,
      };

      if (!tempId) setMessages((prev) => [...prev, optimisticMessage]);
      else setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, status: "sending" } : msg)));

      try {
        setLoading(true);
        const { data: message, error } = await supabase
          .from("direct_messages")
          .insert({ content: content.trim(), sender_id: userId, recipient_id: recipientId, status: "sent" })
          .select()
          .single();
        if (error) throw error;

        if (tempId) removeFromQueue(tempId);

        setMessages((prev) => prev.map((msg) => (msg.id === optimisticId ? { ...message, status: "sent" } : msg)));
        return true;
      } catch (error) {
        console.error(error);
        setMessages((prev) => prev.map((msg) => (msg.id === optimisticId ? { ...msg, status: "failed" } : msg)));

        if (!tempId)
          addToQueue({
            tempId: optimisticId,
            content,
            recipientId,
            timestamp: Date.now(),
            retryCount: 0,
            priority: "normal",
            nextRetryAt: Date.now() + 1000,
          });
        else updateRetryCount(tempId);

        toast({
          title: "Message failed",
          description: connectionStatus === "offline" ? "No internet. Will retry." : "Tap to retry.",
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId, toast, addToQueue, removeFromQueue, updateRetryCount, connectionStatus],
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg || msg.status !== "failed") return false;
      return sendMessage(msg.content, msg.recipient_id, messageId);
    },
    [messages, sendMessage],
  );

  const retryQueuedMessage = useCallback(
    async (tempId: string, content: string, recipientId: string) => {
      return sendMessage(content, recipientId, tempId);
    },
    [sendMessage],
  );

  // -------------------------------
  // Auto delivery receipts
  // -------------------------------
  const markMessagesAsDelivered = useCallback(async () => {
    if (!userId) return;

    const undelivered = messagesRef.current.filter((m) => m.recipient_id === userId && m.status === "sent");
    if (undelivered.length === 0) return;

    setMessages((prev) =>
      prev.map((m) => (undelivered.some((u) => u.id === m.id) ? { ...m, status: "delivered" } : m)),
    );

    if (broadcastChannelRef.current) {
      for (const msg of undelivered) {
        await broadcastChannelRef.current.send({
          type: "broadcast",
          event: "delivery_receipt",
          payload: { messageId: msg.id, deliveredTo: userId },
        });
      }
    }

    try {
      const { error } = await supabase.rpc("mark_messages_delivered", { recipient_user_id: userId });
      if (error) console.error(error);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  // -------------------------------
  // Send message with attachments
  // -------------------------------
  const sendMessageWithAttachments = useCallback(
    async (content: string, recipientId: string, attachments: any[]) => {
      if (!userId || !content.trim()) return false;
      
      const optimisticId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        content: content.trim(),
        sender_id: userId,
        recipient_id: recipientId,
        created_at: new Date().toISOString(),
        status: "sending",
        optimistic: true,
        attachments,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        setLoading(true);
        const { data: message, error } = await supabase
          .from("direct_messages")
          .insert({ 
            content: content.trim(), 
            sender_id: userId, 
            recipient_id: recipientId, 
            status: "sent",
            attachments 
          })
          .select()
          .single();
        if (error) throw error;

        setMessages((prev) => prev.map((msg) => (msg.id === optimisticId ? { ...message, status: "sent" as MessageStatus } : msg)));
        return true;
      } catch (error) {
        console.error(error);
        setMessages((prev) => prev.map((msg) => (msg.id === optimisticId ? { ...msg, status: "failed" } : msg)));
        toast({
          title: "Message failed",
          description: "Could not send message with attachments.",
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId, toast],
  );

  // -------------------------------
  // Mark message as read
  // -------------------------------
  const markMessageAsRead = useCallback(
    async (messageId: string) => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from("direct_messages")
          .update({ status: "read", read_at: new Date().toISOString() })
          .eq("id", messageId)
          .eq("recipient_id", userId);

        if (error) throw error;

        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, status: "read" as MessageStatus } : msg))
        );
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    },
    [userId],
  );

  // -------------------------------
  // Fetch missed messages (compatibility method)
  // -------------------------------
  const fetchMissedMessages = useCallback(
    async (otherUserId: string) => {
      // This is a compatibility method - just refetch messages
      return fetchMessages(otherUserId, false);
    },
    [fetchMessages],
  );

  // -------------------------------
  // Mark conversation as read (compatibility method)
  // -------------------------------
  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      // Mark all unread messages in this conversation as read
      await markMessagesAsDelivered();
    },
    [markMessagesAsDelivered],
  );

  // -------------------------------
  // Add or update messages
  // -------------------------------
  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      const exists = prev.some(
        (m) =>
          m.id === msg.id ||
          (m.optimistic &&
            m.sender_id === msg.sender_id &&
            m.content === msg.content &&
            Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000),
      );
      if (exists)
        return prev.map((m) =>
          m.id === msg.id || (m.optimistic && m.sender_id === msg.sender_id && m.content === msg.content)
            ? { ...msg, optimistic: false }
            : m,
        );
      return [...prev, msg];
    });
  }, []);

  const updateMessage = useCallback((msg: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
  }, []);

  // -------------------------------
  // Broadcast channel setup
  // -------------------------------
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`read-receipts:${userId}`)
      .on("broadcast", { event: "read_receipt" }, (payload) => {
        const { messageId } = payload.payload;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId && m.sender_id === userId ? { ...m, status: "read" as MessageStatus } : m)),
        );
      })
      .on("broadcast", { event: "delivery_receipt" }, (payload) => {
        const { messageId } = payload.payload;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId && m.sender_id === userId ? { ...m, status: "delivered" as MessageStatus } : m)),
        );
      })
      .subscribe();

    broadcastChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // -------------------------------
  // Postgres subscription for real-time messages
  // -------------------------------
  useEffect(() => {
    if (!userId) return;

    const messagesChannel = supabase
      .channel(`direct-messages-changes:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${userId}` },
        async (payload) => {
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
            attachments: newMessage.attachments || [],
          });
          await markMessagesAsDelivered();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${userId}` },
        (payload) => {
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
            attachments: updatedMessage.attachments || [],
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages", filter: `sender_id=eq.${userId}` },
        (payload) => {
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
            attachments: updatedMessage.attachments || [],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [userId, addMessage, updateMessage, markMessagesAsDelivered]);

  return {
    messages,
    loading,
    loadingOlder,
    hasMoreMessages,
    fetchMessages,
    fetchOlderMessages,
    sendMessage,
    sendMessageWithAttachments,
    retryMessage,
    markMessagesAsDelivered,
    markMessageAsRead,
    markConversationAsRead,
    fetchMissedMessages,
    addMessage,
    updateMessage,
    broadcastChannelRef,
    setActiveConversationId: (id: string | null) => (activeConversationIdRef.current = id),
  };
};
