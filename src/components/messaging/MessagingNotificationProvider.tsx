import { useEffect, useRef, useCallback, type ReactElement } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { useConversations } from '@/hooks/useConversations';
import { toast } from '@/components/ui/use-toast';
import { playMessagingChime, sendBrowserNotification } from '@/utils/audioUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/** Show a notification for a new inbound message (sound + in-app toast / native push). */
async function notifyNewMessage(
  message: { id: string; content?: string; sender_id: string },
  isChatOpen: boolean,
  openChat: (senderId: string) => Promise<void>,
  notifiedIds: Set<string>
) {
  if (notifiedIds.has(message.id)) return;
  notifiedIds.add(message.id);

  // Sound — always play in foreground
  await playMessagingChime(undefined, 'single');

  if (isChatOpen) return;

  const body = message.content?.slice(0, 120) || 'You have a new message.';

  // Native local notification on mobile (shows in notification tray / status bar)
  if (window.Capacitor?.isNativePlatform?.()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'New message',
            body,
            id: Math.floor(Date.now() / 1000) & 0x7fffffff,
            channelId: 'messages',
            extra: { sender_id: message.sender_id },
          },
        ],
      });
    } catch (e) {
      console.warn('[MessagingNotification] Local notification failed:', e);
    }
  }

  // In-app toast (web / foreground)
  toast({
    title: 'New message',
    description: body,
    action: (
      <button
        onClick={() => openChat(message.sender_id)}
        className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm"
      >
        Open Chat
      </button>
    ) as unknown as ReactElement,
  });

  // Browser push (web background)
  await sendBrowserNotification('New message', { body });
}

const MessagingNotificationProvider = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatOpen = location.pathname.startsWith('/chat') || location.pathname.startsWith('/messages');
  const { createOrFindConversation } = useConversations(user?.id);
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  // Track the earliest "already seen" timestamp to avoid notifying on old messages at mount
  const mountedAtRef = useRef<string>(new Date().toISOString());

  const openChat = useCallback(async (senderId: string) => {
    try {
      const convId = await createOrFindConversation(senderId);
      if (convId) navigate(`/chat/${convId}`);
      else navigate('/messages');
    } catch {
      navigate('/messages');
    }
  }, [createOrFindConversation, navigate]);

  // ── Realtime subscription (primary path) ──────────────────────────────────
  useMessageSubscriptions({
    userId: user?.id,
    onNewMessage: async (message) => {
      if (!user) return;
      // Ignore messages that arrived before this session mounted
      if (message.created_at && message.created_at < mountedAtRef.current) return;
      await notifyNewMessage(message, isChatOpen, openChat, notifiedIdsRef.current);
    },
    onMessageUpdate: () => {},
    onConversationUpdate: () => {},
  });

  // ── Polling fallback (fires only when Supabase Realtime is unavailable) ───
  useEffect(() => {
    if (!user) return;
    let active = true;
    let lastChecked = mountedAtRef.current;

    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .select('id, content, sender_id, recipient_id, created_at')
          .eq('recipient_id', user.id)
          .gt('created_at', lastChecked)
          .order('created_at', { ascending: true })
          .limit(20);

        if (!active || error || !data?.length) return;

        for (const msg of data) {
          if (msg.sender_id !== user.id) {
            await notifyNewMessage(msg, isChatOpen, openChat, notifiedIdsRef.current);
          }
          if (msg.created_at > lastChecked) lastChecked = msg.created_at;
        }
      } catch (err) {
        console.error('[MessagingNotification] Polling error:', err);
      }
    };

    // Start polling after a 5-second delay to give Realtime time to connect first
    let intervalId: number | undefined;
    const warmupTimer = window.setTimeout(() => {
      poll();
      intervalId = window.setInterval(poll, 15_000);
    }, 5_000);

    return () => {
      active = false;
      window.clearTimeout(warmupTimer);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [user, isChatOpen, openChat]);

  return null;
};

export default MessagingNotificationProvider;
