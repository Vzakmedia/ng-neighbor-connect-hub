import React, { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { createSafeSubscription } from "@/utils/realtimeUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

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

  // Store all subscriptions
  const subscriptionsRef = useRef<Array<{ unsubscribe: () => void }>>([]);
  const seenClientMessageIds = useRef<Set<string>>(new Set()); // dedupe

  const isMessagingRoute = location.pathname.startsWith("/messages") || location.pathname.startsWith("/chat");
  const isCommunityRoute = location.pathname === "/community" || location.pathname === "/";
  const isSafetyRoute = location.pathname.startsWith("/safety");

  useEffect(() => {
    if (!user) return;

    console.log("[RealtimeProvider] Setting up subscriptions", { route: location.pathname });

    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    // ================================
    // 1. Direct Messages Subscription (FILTERED by recipient_id)
    // ================================
    if (isMessagingRoute) {
      // Subscribe to messages where user is the RECIPIENT (incoming)
      const incomingMessagesSub = createSafeSubscription(
        (channel) =>
          channel.on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "direct_messages",
              filter: `recipient_id=eq.${user.id}`, // Only receive messages sent TO this user
            },
            (payload) => {
              const msg = payload.new;

              // Deduplication: ignore if client_message_id already exists locally
              if (msg.client_message_id && seenClientMessageIds.current.has(msg.client_message_id)) return;
              if (msg.client_message_id) seenClientMessageIds.current.add(msg.client_message_id);

              console.log('[RealtimeProvider] Incoming message received:', msg.id);
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

      // Subscribe to messages where user is the SENDER (for optimistic UI confirmations)
      const outgoingMessagesSub = createSafeSubscription(
        (channel) =>
          channel.on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "direct_messages",
              filter: `sender_id=eq.${user.id}`, // Only receive messages sent BY this user
            },
            (payload) => {
              const msg = payload.new;

              // Deduplication
              if (msg.client_message_id && seenClientMessageIds.current.has(msg.client_message_id)) return;
              if (msg.client_message_id) seenClientMessageIds.current.add(msg.client_message_id);

              console.log('[RealtimeProvider] Outgoing message confirmed:', msg.id);
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
    }

    // ================================
    // 2. Read Receipts (Broadcast)
    // ================================
    if (isMessagingRoute) {
      const readReceiptChannel = supabase
        .channel(`unified-read-receipts:${user.id}`)
        .on("broadcast", { event: "read_receipt" }, (payload: any) => {
          const { messageId } = payload.payload;
          if (messageId) readReceiptCallbacks.current.forEach((cb) => cb(messageId));
        })
        .subscribe();
      subscriptions.push({ unsubscribe: () => supabase.removeChannel(readReceiptChannel) });
    }

    // ================================
    // 3. Community Posts Subscription
    // ================================
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
          (payload) => {
            communityPostCallbacks.current.forEach((cb) => cb(payload));
          },
        ),
      {
        channelName: "unified-community-posts",
        pollInterval: 30000,
        debugName: "RealtimeProvider-CommunityPosts",
      },
    );
    subscriptions.push(communityPostsSub);

    // ================================
    // 4. Alerts Subscription
    // ================================
    const alertsSub = createSafeSubscription(
      (channel) =>
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "alert_notifications",
            filter: `recipient_id.eq.${user.id}`,
          },
          (payload) => {
            alertCallbacks.current.forEach((cb) => cb(payload));
          },
        ),
      {
        channelName: "unified-alerts",
        pollInterval: 30000,
        debugName: "RealtimeProvider-Alerts",
      },
    );
    subscriptions.push(alertsSub);

    // ================================
    // 5. Safety Alerts (Route-Specific, filtered by status)
    // ================================
    if (isSafetyRoute) {
      // Only subscribe to active safety alerts
      const safetyAlertsSub = createSafeSubscription(
        (channel) =>
          channel.on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "safety_alerts",
              filter: "status=eq.active", // Only active alerts
            },
            (payload) => safetyAlertCallbacks.current.forEach((cb) => cb(payload)),
          ),
        { channelName: "unified-safety-alerts", pollInterval: 30000, debugName: "RealtimeProvider-SafetyAlerts" },
      );
      subscriptions.push(safetyAlertsSub);

      // Panic alerts for this user
      const panicAlertsSub = createSafeSubscription(
        (channel) =>
          channel.on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "panic_alerts",
              filter: `user_id=eq.${user.id}`, // Only this user's panic alerts
            },
            (payload) => panicAlertCallbacks.current.forEach((cb) => cb(payload)),
          ),
        { channelName: `unified-panic-alerts:${user.id}`, pollInterval: 30000, debugName: "RealtimeProvider-PanicAlerts" },
      );
      subscriptions.push(panicAlertsSub);
    }

    // ================================
    // 6. Post Likes / Comments (filtered by user_id for own posts)
    // ================================
    if (isCommunityRoute) {
      // Subscribe to likes on posts by this user
      const postLikesSub = createSafeSubscription(
        (channel) =>
          channel.on(
            "postgres_changes",
            { 
              event: "*", 
              schema: "public", 
              table: "post_likes",
              filter: `user_id=eq.${user.id}`, // Likes by this user (for optimistic updates)
            },
            (payload) => postLikeCallbacks.current.forEach((cb) => cb(payload)),
          ),
        { channelName: `unified-post-likes:${user.id}`, pollInterval: 30000, debugName: "RealtimeProvider-PostLikes" },
      );
      subscriptions.push(postLikesSub);

      // Subscribe to comments by this user
      const postCommentsSub = createSafeSubscription(
        (channel) =>
          channel.on(
            "postgres_changes",
            { 
              event: "*", 
              schema: "public", 
              table: "post_comments",
              filter: `user_id=eq.${user.id}`, // Comments by this user
            },
            (payload) => postCommentCallbacks.current.forEach((cb) => cb(payload)),
          ),
        { channelName: `unified-post-comments:${user.id}`, pollInterval: 30000, debugName: "RealtimeProvider-PostComments" },
      );
      subscriptions.push(postCommentsSub);
    }

    // Store subscriptions
    subscriptionsRef.current = subscriptions;

    // Cleanup on unmount or route change
    return () => {
      console.log("[RealtimeProvider] Cleaning up subscriptions", { count: subscriptions.length });
      subscriptionsRef.current.forEach((sub) => sub?.unsubscribe());
      subscriptionsRef.current = [];
      seenClientMessageIds.current.clear(); // reset dedupe cache
    };
  }, [user, location.pathname, isMessagingRoute, isCommunityRoute, isSafetyRoute]);

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
