import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { useConversations } from '@/hooks/useConversations';
import { toast } from '@/components/ui/use-toast';
import { playMessagingChime, sendBrowserNotification } from '@/utils/audioUtils';
import { useNavigate } from 'react-router-dom';

const MessagingNotificationProvider = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createOrFindConversation } = useConversations(user?.id);

  useMessageSubscriptions({
    userId: user?.id,
    onNewMessage: async (message: any) => {
      if (!user) return;
      // Only notify for messages received by current user
      if (message.recipient_id === user.id && message.sender_id !== user.id) {
        // Sound (foreground)
        await playMessagingChime();

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
    },
    onMessageUpdate: () => {},
    onConversationUpdate: () => {},
  });

  // No UI required
  useEffect(() => {}, []);
  return null;
};

export default MessagingNotificationProvider;
