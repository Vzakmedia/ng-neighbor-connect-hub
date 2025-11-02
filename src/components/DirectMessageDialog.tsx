import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Check, CheckCheck, Clock, AlertCircle, RotateCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages, MessageStatus } from '@/hooks/useDirectMessages';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { useConversations } from '@/hooks/useConversations';
import { ConnectionStatusBanner } from '@/components/messaging/ConnectionStatusBanner';

interface DirectMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

export const DirectMessageDialog = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar
}: DirectMessageDialogProps) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const { 
    messages, 
    loading, 
    fetchMessages, 
    sendMessage, 
    markMessageAsRead,
    addMessage,
    updateMessage,
    retryMessage 
  } = useDirectMessages(user?.id);

  const { createOrFindConversation } = useConversations(user?.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set up real-time subscriptions
  useMessageSubscriptions({
    userId: user?.id,
    recipientId,
    onNewMessage: (message) => {
      addMessage(message);
      // Mark as read if user is recipient
      if (message.recipient_id === user?.id) {
        markMessageAsRead(message.id);
      }
      setTimeout(scrollToBottom, 100);
    },
    onMessageUpdate: updateMessage
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user && recipientId) {
      initializeConversation();
    }
  }, [isOpen, user, recipientId]);

  const initializeConversation = async () => {
    if (!user) return;

    try {
      const convId = await createOrFindConversation(recipientId);
      if (convId) {
        setConversationId(convId);
        await fetchMessages(recipientId);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !recipientId || loading) return;

    const success = await sendMessage(newMessage, recipientId);
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = (message: any) => {
    if (message.sender_id !== user?.id) return null;

    const status: MessageStatus = message.status || 'sent';

    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={recipientAvatar} />
              <AvatarFallback>
                {recipientName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span>Message {recipientName}</span>
          </DialogTitle>
          <DialogDescription>
            Send and receive direct messages with {recipientName}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4">
          <ConnectionStatusBanner />
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              const isFailed = message.status === 'failed';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-end gap-2">
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        isOwnMessage
                          ? isFailed 
                            ? 'bg-destructive/10 text-foreground border border-destructive/30'
                            : 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-xs opacity-70">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {getStatusIcon(message)}
                      </div>
                    </div>
                    
                    {isFailed && isOwnMessage && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => retryMessage(message.id)}
                      >
                        <RotateCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 min-h-[40px] max-h-[120px]"
              rows={1}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || loading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};