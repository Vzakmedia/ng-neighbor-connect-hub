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
import { PaperAirplaneIcon, CheckIcon, CheckBadgeIcon, ClockIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages, MessageStatus } from '@/hooks/useDirectMessages';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { useConversations } from '@/hooks/useConversations';
import { ConnectionStatusBanner } from '@/components/messaging/ConnectionStatusBanner';
import EmojiPickerButton from '@/components/messaging/EmojiPickerButton';

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
  const [requestStatus, setRequestStatus] = useState<'pending' | 'accepted' | 'declined' | null>(null);
  const [isRecipient, setIsRecipient] = useState(false);
  const [handlingRequest, setHandlingRequest] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
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

  const { createOrFindConversation, fetchConversations } = useConversations(user?.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set up real-time subscriptions
  useMessageSubscriptions({
    userId: user?.id,
    recipientId,
    onNewMessage: (message) => {
      // If we are pending recipient, ignore new messages until accepted (or just don't show them)
      if (requestStatus === 'pending' && isRecipient) return;

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
    setRequestStatus(null);
    setIsRecipient(false);

    try {
      const convId = await createOrFindConversation(recipientId);
      if (convId) {
        setConversationId(convId);

        // Check request status
        const { data: convData, error } = await import('@/integrations/supabase/client').then(m => m.supabase
          .from('direct_conversations')
          .select('request_status, user2_id')
          .eq('id', convId)
          .single()
        );

        if (!error && convData) {
          setRequestStatus(convData.request_status);
          setIsRecipient(convData.user2_id === user.id);

          // Only fetch messages if accepted OR if we are the sender
          if (convData.request_status === 'accepted' || convData.user2_id !== user.id) {
            await fetchMessages(recipientId);
          }
        } else {
          // Fallback if fetch fails (assume accepted/sender logic or just fetch)
          await fetchMessages(recipientId);
        }
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const handleRequestAction = async (action: 'accept' | 'decline') => {
    if (!conversationId) return;
    setHandlingRequest(true);

    try {
      const { data, error } = await import('@/integrations/supabase/client').then(m => m.supabase
        .rpc('handle_message_request', {
          conversation_id: conversationId,
          action: action
        })
      );

      if (error) throw error;

      if (action === 'accept') {
        setRequestStatus('accepted');
        await fetchMessages(recipientId);
        fetchConversations(); // Update global list
      } else {
        onClose();
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    } finally {
      setHandlingRequest(false);
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

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const getStatusIcon = (message: any) => {
    if (message.sender_id !== user?.id) return null;

    const status: MessageStatus = message.status || 'sent';

    switch (status) {
      case 'sending':
        return <ClockIcon className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-3 w-3 text-destructive" />;
      case 'sent':
        return <CheckIcon className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckBadgeIcon className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckBadgeIcon className="h-3 w-3 text-primary" />;
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
            {requestStatus === 'pending' && isRecipient
              ? `Message Request from ${recipientName}`
              : `Send and receive direct messages with ${recipientName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4">
          <ConnectionStatusBanner />
        </div>

        {requestStatus === 'pending' && isRecipient ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Avatar className="h-14 w-14">
                <AvatarImage src={recipientAvatar} />
                <AvatarFallback>{recipientName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{recipientName} wants to send you a message</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Accepting this request will allow you to chat and see their message history.
              </p>
            </div>
            <div className="flex gap-4 w-full max-w-xs">
              <Button
                className="flex-1"
                onClick={() => handleRequestAction('accept')}
                disabled={handlingRequest}
              >
                Accept
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleRequestAction('decline')}
                disabled={handlingRequest}
              >
                Decline
              </Button>
            </div>
          </div>
        ) : (
          <>
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
                          className={`max-w-[70%] p-3 rounded-lg ${isOwnMessage
                            ? isFailed
                              ? 'bg-destructive/10 text-foreground border border-destructive/30'
                              : 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                            }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'
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
                            <ArrowPathIcon className="h-3 w-3" />
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
                <EmojiPickerButton
                  onEmojiSelect={handleEmojiSelect}
                  disabled={loading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || loading}
                  size="icon"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};