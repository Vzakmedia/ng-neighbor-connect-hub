import React, { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { createSafeSubscription } from "@/utils/realtimeUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { connectAblyChat } from "@/services/ablyChat";

// Event callback types
type CommunityPostCallback = (payload: any) => void;
type MessageCallback = (payload: any) => void;
type ConversationCallback = (payload: any) => void;
type AlertCallback = (payload: any) => void;
type SafetyAlertCallback = (payload: any) => void;
type PanicAlertCallback = (payload: any) => void;
type PostLikeCallback = (payload: any) => void;
type PostCommentCallback = (payload: any) => void;
type ReadReceiptCallback = (messageId: string) => void;

interface RealtimeContextValue {
  onCommunityPost: (callback: CommunityPostCallback) => () => void;
  onMessage: (callback: MessageCallback) => () => void;
  onConversation: (callback: ConversationCallback) => () => void;
  onAlert: (callback: AlertCallback) => () => void;
  onSafetyAlert: (callback: SafetyAlertCallback) => () => void;
  onPanicAlert: (callback: PanicAlertCallback) => () => void;
  onPostLike: (callback: PostLikeCallback) => () => void;
  onPostComment: (callback: PostCommentCallback) => () => void;
  onReadReceipt: (callback: ReadReceiptCallback) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtimeContext must be used within RealtimeProvider");
  return context;
};

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Callback registries
  const communityPostCallbacks = useRef<Set<CommunityPostCallback>>(new Set());
  const messageCallbacks = useRef<Set<MessageCallback>>(new Set());
  const conversationCallbacks = useRef<Set<ConversationCallback>>(new Set());
  const alertCallbacks = useRef<Set<AlertCallback>>(new Set());
  const safetyAlertCallbacks = useRef<Set<SafetyAlertCallback>>(new Set());
  const panicAlertCallbacks = useRef<Set<PanicAlertCallback>>(new Set());
  const postLikeCallbacks = useRef<Set<PostLikeCallback>>(new Set());
  const postCommentCallbacks = useRef<Set<PostCommentCallback>>(new Set());
  const readReceiptCallbacks = useRef<Set<ReadReceiptCallback>>(new Set());

  const seenClientMessageIds = useRef<Set<string>>(new Set()); // dedupe (optimistic sends)

  // Cross-source dedupe: messages arrive via BOTH Ably (primary, fast) and
  // Supabase postgres_changes (fallback). Whichever arrives second is dropped.
  const seenEventKeys = useRef<Set<string>>(new Set());
  const markEventSeen = (key: string): boolean => {
    if (seenEventKeys.current.has(key)) return false;
    seenEventKeys.current.add(key);
    // Bound memory: drop the oldest half once the set grows large
    if (seenEventKeys.current.size > 2000) {
      let i = 0;
      for (const k of seenEventKeys.current) {
        seenEventKeys.current.delete(k);
        if (++i >= 1000) break;
      }
    }
    return true;
  };

  const isCommunityRoute = location.pathname === "/community" || location.pathname === "/";

  // Persistent subscriptions: messages, conversations, receipts, alerts.
  // Deps: [user] only — never restart on route changes.
  useEffect(() => {
    if (!user) return;

    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    // 1. Direct Messages (incoming)
    const incomingMessagesSub = createSafeSubscription(
      (channel) =>
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const msg = payload.new;
            if (msg.client_message_id && seenClientMessageIds.current.has(msg.client_message_id)) return;
            if (msg.client_message_id) seenClientMessageIds.current.add(msg.client_message_id);
            if (msg.id && !markEventSeen(`ins:${msg.id}`)) return; // already delivered via Ably
            messageCallbacks.current.forEach((cb) => cb({ eventType: 'INSERT', new: msg }));
          },
        ),
      {
        channelName: `realtime-incoming-messages:${user.id}`,
        pollInterval: 30000,
        debugName: "RealtimeProvider-IncomingMessages",
      },
    );
    subscriptions.push(incomingMessagesSub);

    // 2. Direct Messages (outgoing confirmations for optimistic UI)
    const outgoingMessagesSub = createSafeSubscription(
      (channel) =>
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
            filter: `sender_id=eq.${user.id}`,
          },
          (payload) => {
            const msg = payload.new;
            if (msg.client_message_id && seenClientMessageIds.current.has(msg.client_message_id)) return;
            if (msg.client_message_id) seenClientMessageIds.current.add(msg.client_message_id);
            if (msg.id && !markEventSeen(`ins:${msg.id}`)) return; // already delivered via Ably
            messageCallbacks.current.forEach((cb) => cb({ eventType: 'INSERT', new: msg }));
          },
        ),
      {
        channelName: `realtime-outgoing-messages:${user.id}`,
        pollInterval: 30000,
        debugName: "RealtimeProvider-OutgoingMessages",
      },
    );
    subscriptions.push(outgoingMessagesSub);

    // 3. Read Receipts (Broadcast)
    const readReceiptChannel = supabase
      .channel(`unified-read-receipts:${user.id}`)
      .on("broadcast", { event: "read_receipt" }, (payload: any) => {
        const { messageId } = payload.payload;
        if (messageId) readReceiptCallbacks.current.forEach((cb) => cb(messageId));
      })
      .subscribe();
    subscriptions.push({ unsubscribe: () => supabase.removeChannel(readReceiptChannel) });

    // 4. Direct Conversations (new conversation or status change)
    const convUser1Sub = createSafeSubscription(
      (channel) =>
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "direct_conversations",
            filter: `user1_id=eq.${user.id}`,
          },
          (payload) => conversationCallbacks.current.forEach((cb) => cb(payload)),
        ),
      {
        channelName: `realtime-conversations-user1:${user.id}`,
        pollInterval: 30000,
        debugName: "RealtimeProvider-ConversationsUser1",
      },
    );
    subscriptions.push(convUser1Sub);

    const convUser2Sub = createSafeSubscription(
      (channel) =>
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "direct_conversations",
            filter: `user2_id=eq.${user.id}`,
          },
          (payload) => conversationCallbacks.current.forEach((cb) => cb(payload)),
        ),
      {
        channelName: `realtime-conversations-user2:${user.id}`,
        pollInterval: 30000,
        debugName: "RealtimeProvider-ConversationsUser2",
      },
    );
    subscriptions.push(convUser2Sub);

    // 5. Alerts
    const alertsSub = createSafeSubscription(
      (channel) =>
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "alert_notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => alertCallbacks.current.forEach((cb) => cb(payload)),
        ),
      {
        channelName: `unified-alerts:${user.id}`,
        pollInterval: 30000,
        debugName: "RealtimeProvider-Alerts",
      },
    );
    subscriptions.push(alertsSub);

    // 6. Safety Alerts (always-on for notification bell)
    const safetyAlertsSub = createSafeSubscription(
      (channel) =>
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "safety_alerts",
            filter: "status=eq.active",
          },
          (payload) => safetyAlertCallbacks.current.forEach((cb) => cb(payload)),
        ),
      { channelName: "unified-safety-alerts", pollInterval: 30000, debugName: "RealtimeProvider-SafetyAlerts" },
    );
    subscriptions.push(safetyAlertsSub);

    // 7. Panic Alerts
    const panicAlertsSub = createSafeSubscription(
      (channel) =>
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "panic_alerts",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => panicAlertCallbacks.current.forEach((cb) => cb(payload)),
        ),
      { channelName: `unified-panic-alerts:${user.id}`, pollInterval: 30000, debugName: "RealtimeProvider-PanicAlerts" },
    );
    subscriptions.push(panicAlertsSub);

    return () => {
      subscriptions.forEach((sub) => sub?.unsubscribe());
      seenClientMessageIds.current.clear();
      seenEventKeys.current.clear();
    };
  }, [user]);

  // Ably: primary chat delivery layer. Supabase postgres_changes (above)
  // stays active as the fallback; markEventSeen dedupes the dual delivery.
  // If the Ably token endpoint or key isn't configured, this no-ops.
  useEffect(() => {
    if (!user) return;

    let cleanup: (() => void) | null = null;
    let cancelled = false;

    connectAblyChat(user.id, (event) => {
      const msg = event.data as any;
      if (!msg?.id) return;

      if (event.name === 'new_message') {
        if (msg.client_message_id && seenClientMessageIds.current.has(msg.client_message_id)) return;
        if (msg.client_message_id) seenClientMessageIds.current.add(msg.client_message_id);
        if (!markEventSeen(`ins:${msg.id}`)) return; // already delivered via Supabase
        messageCallbacks.current.forEach((cb) => cb({ eventType: 'INSERT', new: msg }));
      } else if (event.name === 'message_updated') {
        if (!markEventSeen(`upd:${msg.id}:${msg.status}:${msg.read_at ?? ''}`)) return;
        messageCallbacks.current.forEach((cb) => cb({ eventType: 'UPDATE', new: msg }));
        if (msg.status === 'read' && msg.sender_id === user.id) {
          readReceiptCallbacks.current.forEach((cb) => cb(msg.id));
        }
      }
    }).then((dispose) => {
      if (cancelled) dispose();
      else cleanup = dispose;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user]);

  // Community subscriptions: restart only when isCommunityRoute changes
  useEffect(() => {
    if (!user) return;

    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    const communityPostsSub = createSafeSubscription(
      (channel) =>
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "community_posts",
            filter: `post_type=neq.private_message`,
          },
          (payload) => communityPostCallbacks.current.forEach((cb) => cb(payload)),
        ),
      {
        channelName: "unified-community-posts",
        pollInterval: 30000,
        debugName: "RealtimeProvider-CommunityPosts",
      },
    );
    subscriptions.push(communityPostsSub);

    if (isCommunityRoute) {
      const postLikesSub = createSafeSubscription(
        (channel) =>
          channel.on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "post_likes",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => postLikeCallbacks.current.forEach((cb) => cb(payload)),
          ),
        { channelName: `unified-post-likes:${user.id}`, pollInterval: 30000, debugName: "RealtimeProvider-PostLikes" },
      );
      subscriptions.push(postLikesSub);

      const postCommentsSub = createSafeSubscription(
        (channel) =>
          channel.on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "post_comments",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => postCommentCallbacks.current.forEach((cb) => cb(payload)),
          ),
        { channelName: `unified-post-comments:${user.id}`, pollInterval: 30000, debugName: "RealtimeProvider-PostComments" },
      );
      subscriptions.push(postCommentsSub);
    }

    return () => {
      subscriptions.forEach((sub) => sub?.unsubscribe());
    };
  }, [user, isCommunityRoute]);

  // -----------------------------
  // Registration Methods
  // -----------------------------
  const onCommunityPost = (cb: CommunityPostCallback) => {
    communityPostCallbacks.current.add(cb);
    return () => communityPostCallbacks.current.delete(cb);
  };
  const onMessage = (cb: MessageCallback) => {
    messageCallbacks.current.add(cb);
    return () => messageCallbacks.current.delete(cb);
  };
  const onConversation = (cb: ConversationCallback) => {
    conversationCallbacks.current.add(cb);
    return () => conversationCallbacks.current.delete(cb);
  };
  const onAlert = (cb: AlertCallback) => {
    alertCallbacks.current.add(cb);
    return () => alertCallbacks.current.delete(cb);
  };
  const onSafetyAlert = (cb: SafetyAlertCallback) => {
    safetyAlertCallbacks.current.add(cb);
    return () => safetyAlertCallbacks.current.delete(cb);
  };
  const onPanicAlert = (cb: PanicAlertCallback) => {
    panicAlertCallbacks.current.add(cb);
    return () => panicAlertCallbacks.current.delete(cb);
  };
  const onPostLike = (cb: PostLikeCallback) => {
    postLikeCallbacks.current.add(cb);
    return () => postLikeCallbacks.current.delete(cb);
  };
  const onPostComment = (cb: PostCommentCallback) => {
    postCommentCallbacks.current.add(cb);
    return () => postCommentCallbacks.current.delete(cb);
  };
  const onReadReceipt = (cb: ReadReceiptCallback) => {
    readReceiptCallbacks.current.add(cb);
    return () => readReceiptCallbacks.current.delete(cb);
  };

  const value: RealtimeContextValue = {
    onCommunityPost,
    onMessage,
    onConversation,
    onAlert,
    onSafetyAlert,
    onPanicAlert,
    onPostLike,
    onPostComment,
    onReadReceipt,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};
