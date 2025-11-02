import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { createSafeSubscription } from '@/utils/realtimeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  // Subscription registration methods
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
  if (!context) {
    throw new Error('useRealtimeContext must be used within RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
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

  // Subscription cleanup refs
  const subscriptionsRef = useRef<Array<{ unsubscribe: () => void }>>([]);

  useEffect(() => {
    if (!user) return;

    console.log('[RealtimeProvider] Setting up unified subscriptions for user:', user.id);

    // 1. Community Posts Subscription
    const communityPostsSub = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'community_posts',
          filter: `post_type=neq.private_message`
        }, (payload) => {
          communityPostCallbacks.current.forEach(cb => cb(payload));
        }),
      {
        channelName: 'unified-community-posts',
        pollInterval: 30000,
        debugName: 'RealtimeProvider-CommunityPosts'
      }
    );

    // 2. Direct Messages Subscription
    const messagesSub = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
        }, (payload) => {
          messageCallbacks.current.forEach(cb => cb(payload));
        }),
      {
        channelName: 'unified-messages',
        pollInterval: 15000,
        debugName: 'RealtimeProvider-Messages'
      }
    );

    // 3. Conversations Subscription
    const conversationsSub = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'direct_conversations',
          filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`
        }, (payload) => {
          conversationCallbacks.current.forEach(cb => cb(payload));
        }),
      {
        channelName: 'unified-conversations',
        pollInterval: 30000,
        debugName: 'RealtimeProvider-Conversations'
      }
    );

    // 4. Alert Notifications Subscription
    const alertsSub = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_notifications',
          filter: `user_id.eq.${user.id}`
        }, (payload) => {
          alertCallbacks.current.forEach(cb => cb(payload));
        }),
      {
        channelName: 'unified-alerts',
        pollInterval: 30000,
        debugName: 'RealtimeProvider-Alerts'
      }
    );

    // 5. Safety Alerts Subscription
    const safetyAlertsSub = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'safety_alerts'
        }, (payload) => {
          safetyAlertCallbacks.current.forEach(cb => cb(payload));
        }),
      {
        channelName: 'unified-safety-alerts',
        pollInterval: 30000,
        debugName: 'RealtimeProvider-SafetyAlerts'
      }
    );

    // 6. Panic Alerts Subscription
    const panicAlertsSub = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'panic_alerts'
        }, (payload) => {
          panicAlertCallbacks.current.forEach(cb => cb(payload));
        }),
      {
        channelName: 'unified-panic-alerts',
        pollInterval: 30000,
        debugName: 'RealtimeProvider-PanicAlerts'
      }
    );

    // 7. Post Likes Subscription
    const postLikesSub = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'post_likes'
        }, (payload) => {
          postLikeCallbacks.current.forEach(cb => cb(payload));
        }),
      {
        channelName: 'unified-post-likes',
        pollInterval: 30000,
        debugName: 'RealtimeProvider-PostLikes'
      }
    );

    // 8. Post Comments Subscription
    const postCommentsSub = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'post_comments'
        }, (payload) => {
          postCommentCallbacks.current.forEach(cb => cb(payload));
        }),
      {
        channelName: 'unified-post-comments',
        pollInterval: 30000,
        debugName: 'RealtimeProvider-PostComments'
      }
    );

    // 9. Read Receipts Broadcast Channel
    const readReceiptChannel = supabase
      .channel(`unified-read-receipts:${user.id}`)
      .on('broadcast', { event: 'read_receipt' }, (payload: any) => {
        const { messageId } = payload.payload;
        if (messageId) {
          readReceiptCallbacks.current.forEach(cb => cb(messageId));
        }
      })
      .subscribe();

    // Store all subscriptions
    subscriptionsRef.current = [
      communityPostsSub,
      messagesSub,
      conversationsSub,
      alertsSub,
      safetyAlertsSub,
      panicAlertsSub,
      postLikesSub,
      postCommentsSub,
      { unsubscribe: () => supabase.removeChannel(readReceiptChannel) }
    ];

    // Cleanup
    return () => {
      console.log('[RealtimeProvider] Cleaning up unified subscriptions');
      subscriptionsRef.current.forEach(sub => sub?.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [user]);

  // Registration methods
  const onCommunityPost = (callback: CommunityPostCallback) => {
    communityPostCallbacks.current.add(callback);
    return () => communityPostCallbacks.current.delete(callback);
  };

  const onMessage = (callback: MessageCallback) => {
    messageCallbacks.current.add(callback);
    return () => messageCallbacks.current.delete(callback);
  };

  const onConversation = (callback: ConversationCallback) => {
    conversationCallbacks.current.add(callback);
    return () => conversationCallbacks.current.delete(callback);
  };

  const onAlert = (callback: AlertCallback) => {
    alertCallbacks.current.add(callback);
    return () => alertCallbacks.current.delete(callback);
  };

  const onSafetyAlert = (callback: SafetyAlertCallback) => {
    safetyAlertCallbacks.current.add(callback);
    return () => safetyAlertCallbacks.current.delete(callback);
  };

  const onPanicAlert = (callback: PanicAlertCallback) => {
    panicAlertCallbacks.current.add(callback);
    return () => panicAlertCallbacks.current.delete(callback);
  };

  const onPostLike = (callback: PostLikeCallback) => {
    postLikeCallbacks.current.add(callback);
    return () => postLikeCallbacks.current.delete(callback);
  };

  const onPostComment = (callback: PostCommentCallback) => {
    postCommentCallbacks.current.add(callback);
    return () => postCommentCallbacks.current.delete(callback);
  };

  const onReadReceipt = (callback: ReadReceiptCallback) => {
    readReceiptCallbacks.current.add(callback);
    return () => readReceiptCallbacks.current.delete(callback);
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
    onReadReceipt
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
