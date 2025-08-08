import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Real-time typing indicator over Supabase Realtime broadcast
// Usage: const { isOtherTyping, notifyTypingStart, notifyTypingStop } = useTypingIndicator(conversationId, currentUserId, otherUserId)
export const useTypingIndicator = (
  conversationId: string | undefined,
  currentUserId: string | undefined,
  otherUserId?: string
) => {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentRef = useRef<number>(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Send a broadcast event safely
  const send = useCallback((event: 'typing' | 'stop_typing') => {
    if (!channelRef.current || !currentUserId) return;
    try {
      channelRef.current.send({
        type: 'broadcast',
        event,
        payload: { userId: currentUserId, conversationId }
      });
    } catch (e) {
      console.warn('Typing broadcast failed', e);
    }
  }, [currentUserId, conversationId]);

  // Public API: call on input change
  const notifyTypingStart = useCallback(() => {
    const now = Date.now();
    // throttle to once per 1000ms
    if (now - lastSentRef.current < 1000) return;
    lastSentRef.current = now;
    send('typing');

    // schedule self stop event after idle 1500ms
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => send('stop_typing'), 1500);
  }, [send]);

  // Explicit stop (e.g., blur, send)
  const notifyTypingStop = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    send('stop_typing');
  }, [send]);

  // Setup channel
  useEffect(() => {
    if (!conversationId) return;

    // Cleanup previous
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(`typing-${conversationId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (!payload?.payload) return;
        const { userId } = payload.payload;
        if (userId && userId !== currentUserId) {
          setIsOtherTyping(true);
          if (otherStopTimerRef.current) clearTimeout(otherStopTimerRef.current);
          otherStopTimerRef.current = setTimeout(() => setIsOtherTyping(false), 2000);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, (payload: any) => {
        const { userId } = payload?.payload || {};
        if (userId && userId !== currentUserId) {
          setIsOtherTyping(false);
          if (otherStopTimerRef.current) {
            clearTimeout(otherStopTimerRef.current);
            otherStopTimerRef.current = null;
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // no-op
        }
      });

    channelRef.current = channel;

    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (otherStopTimerRef.current) clearTimeout(otherStopTimerRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, currentUserId]);

  return { isOtherTyping, notifyTypingStart, notifyTypingStop };
};
