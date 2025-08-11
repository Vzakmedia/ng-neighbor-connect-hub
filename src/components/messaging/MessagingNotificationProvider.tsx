import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { useConversations } from '@/hooks/useConversations';
import { toast } from '@/components/ui/use-toast';
import { playMessagingChime, sendBrowserNotification } from '@/utils/audioUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const MessagingNotificationProvider = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatOpen = location.pathname.startsWith('/chat') || location.pathname.startsWith('/messages');
  const { createOrFindConversation } = useConversations(user?.id);

  useMessageSubscriptions({
    userId: user?.id,
    onNewMessage: async (message: any) => {
      if (!user) return;
      // Only notify for messages received by current user
      if (message.recipient_id === user.id && message.sender_id !== user.id) {
        // Sound (foreground)
        await playMessagingChime(undefined, 'single');

        if (!isChatOpen) {
          // In-app toast
          toast({
            title: 'New message',
            description: message.content?.slice(0, 120) || 'You have a new message.',
            action: (
              <button
                onClick={async () => {
                  try {
                    const convId = await createOrFindConversation(message.sender_id);
                    if (convId) navigate(`/chat/${convId}`);
                  } catch (e) {
                    navigate('/messages');
                  }
                }}
                className="px-3 py-1 rounded-md bg-primary text-primary-foreground"
              >
                Open Chat
              </button>
            ) as any,
          });

          // Browser push (background)
          await sendBrowserNotification('New message', {
            body: message.content || 'You have a new message.',
          });
        }
      }
    },
    onMessageUpdate: () => {},
    onConversationUpdate: () => {},
  });

// Polling fallback for new messages when realtime is unavailable
  const lastCheckedRef = useRef<string | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    let active = true;

    // Prevent notification spam on reload: ignore existing messages
    if (!lastCheckedRef.current) {
      lastCheckedRef.current = new Date().toISOString();
    }

    const poll = async () => {
      try {
        const since = lastCheckedRef.current;
        let query = supabase
          .from('direct_messages')
          .select('id, content, sender_id, recipient_id, created_at')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (since) {
          query = query.gt('created_at', since);
        }

        const { data, error } = await query;
        if (!active) return;
        if (error) {
          console.error('Notification poll error', error);
          return;
        }

        if (data && data.length) {
          let maxCreatedAt: string | null = since;
          // Oldest first to keep order
          for (const msg of [...data].reverse()) {
            if (msg.sender_id !== user.id && !notifiedIdsRef.current.has(msg.id)) {
              await playMessagingChime(undefined, 'single');
              if (!isChatOpen) {
                toast({
                  title: 'New message',
                  description: msg.content?.slice(0, 120) || 'You have a new message.',
                  action: (
                    <button
                      onClick={async () => {
                        try {
                          const convId = await createOrFindConversation(msg.sender_id);
                          if (convId) navigate(`/chat/${convId}`);
                        } catch (e) {
                          navigate('/messages');
                        }
                      }}
                      className="px-3 py-1 rounded-md bg-primary text-primary-foreground"
                    >
                      Open Chat
                    </button>
                  ) as any,
                });

                await sendBrowserNotification('New message', {
                  body: msg.content || 'You have a new message.',
                });
              }
              notifiedIdsRef.current.add(msg.id);
            }
            if (!maxCreatedAt || msg.created_at > maxCreatedAt) {
              maxCreatedAt = msg.created_at;
            }
          }
          lastCheckedRef.current = maxCreatedAt || since;
        }
      } catch (err) {
        console.error('Notification polling unexpected error', err);
      }
    };

    // initial check and interval
    poll();
    const interval = window.setInterval(poll, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user, navigate, createOrFindConversation, isChatOpen]);

  // No UI required
  useEffect(() => {}, []);
  return null;
};

export default MessagingNotificationProvider;
