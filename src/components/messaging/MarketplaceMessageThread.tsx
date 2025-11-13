import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Package, ShoppingBag } from '@/lib/icons';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  status: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface MarketplaceMessageThreadProps {
  conversationId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserId: string;
  conversationType: string;
  onBack?: () => void;
}

const MarketplaceMessageThread: React.FC<MarketplaceMessageThreadProps> = ({
  conversationId,
  otherUserName,
  otherUserAvatar,
  otherUserId,
  conversationType,
  onBack
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !conversationId) return;
    
    fetchMessages();
    
    // Set up real-time subscription for messages
    const channel = supabase
      .channel(`marketplace-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (isMessageForConversation(newMsg)) {
            fetchMessages(); // Refetch to get sender details
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isMessageForConversation = (message: any) => {
    return (
      (message.sender_id === user?.id && message.recipient_id === otherUserId) ||
      (message.sender_id === otherUserId && message.recipient_id === user?.id)
    );
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles for messages
      const messagesWithProfiles = await Promise.all(
        data.map(async (msg) => {
          if (msg.sender_id === user.id) {
            return {
              ...msg,
              sender_name: 'You',
              sender_avatar: null
            };
          } else {
            return {
              ...msg,
              sender_name: otherUserName,
              sender_avatar: otherUserAvatar
            };
          }
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: otherUserId,
          content: newMessage.trim(),
          status: 'sent'
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b bg-background">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        
        <Avatar className="w-10 h-10">
          <AvatarImage src={otherUserAvatar || undefined} />
          <AvatarFallback>
            {otherUserName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-semibold">{otherUserName}</h3>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            {conversationType === 'marketplace' && (
              <>
                <Package className="w-3 h-3" />
                <span>Marketplace conversation</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground ml-12'
                    : 'bg-muted mr-12'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                  {message.sender_id === user?.id && (
                    <span className="ml-2">
                      {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : '○'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 min-h-0 resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceMessageThread;