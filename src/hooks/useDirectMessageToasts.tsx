import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRealtimeContext } from '@/contexts/RealtimeContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface MessageDetails {
  content: string;
  sender_id: string;
  conversation_id: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

export const useDirectMessageToasts = () => {
  const { onMessage } = useRealtimeContext();
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const recentMessageIds = useRef<Set<string>>(new Set());
  const lastToastTime = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onMessage(async (payload) => {
      // Only show toasts for new messages (INSERT events)
      if (payload.eventType !== 'INSERT') return;

      // Don't show toasts when on messages or chat routes
      const isMessagesRoute = location.pathname === '/messages' || location.pathname.startsWith('/chat/');
      if (isMessagesRoute) return;

      const messageId = payload.new?.id;
      const senderId = payload.new?.sender_id;
      
      if (!messageId || !senderId) return;

      // Don't show toast for own messages
      if (senderId === user.id) return;

      // Prevent duplicate toasts for the same message
      if (recentMessageIds.current.has(messageId)) return;
      recentMessageIds.current.add(messageId);

      // Cleanup old message IDs after 30 seconds
      setTimeout(() => {
        recentMessageIds.current.delete(messageId);
      }, 30000);

      // Cooldown between toasts (2 seconds)
      const now = Date.now();
      if (now - lastToastTime.current < 2000) return;
      lastToastTime.current = now;

      try {
        // Fetch message details with sender information
        const { data: messageData, error } = await supabase
          .from('direct_messages')
          .select(`
            content,
            sender_id,
            conversation_id,
            sender:profiles!direct_messages_sender_id_fkey(full_name, avatar_url)
          `)
          .eq('id', messageId)
          .single();

        if (error || !messageData) {
          console.error('Failed to fetch message details for toast:', error);
          return;
        }

        const { content, conversation_id, sender } = messageData as MessageDetails;
        
        // Create content preview (first 50 characters)
        const contentPreview = content.length > 50 
          ? `${content.substring(0, 50)}...` 
          : content;

        const senderName = sender?.full_name || 'Someone';

        // Show toast notification
        toast({
          title: `New message from ${senderName}`,
          description: contentPreview,
          action: (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/chat/${conversation_id}`)}
              className="shrink-0"
            >
              View
            </Button>
          ),
          duration: 6000, // 6 seconds to allow reading
        });
      } catch (error) {
        console.error('Error showing direct message toast:', error);
      }
    });

    return unsubscribe;
  }, [location.pathname, onMessage, toast, navigate, user]);
};
