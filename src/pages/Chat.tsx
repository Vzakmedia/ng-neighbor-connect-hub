import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useConversations } from '@/hooks/useConversations';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useWebRTCCall } from '@/hooks/messaging/useWebRTCCall';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Phone, Video, MoreVertical, CheckSquare, Trash2, PhoneCall } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import MessageThread from '@/components/messaging/MessageThread';
import { VideoCallDialog } from '@/components/messaging/VideoCallDialog';
import { IncomingCallDialog } from '@/components/messaging/IncomingCallDialog';

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { deleteMessages, deleteConversation } = useMessageActions();

  const { 
    messages, 
    fetchMessages, 
    sendMessage,
    sendMessageWithAttachments,
    markMessageAsRead,
    markConversationAsRead,
    addMessage,
    updateMessage 
  } = useDirectMessages(user?.id);

  const { conversations, fetchConversations } = useConversations(user?.id);

  // WebRTC call functionality
  const {
    isInCall,
    isVideoCall,
    localStream,
    remoteStream,
    incomingCall,
    startVoiceCall,
    startVideoCall,
    answerCall,
    declineCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useWebRTCCall(conversationId || '');

  // Set up real-time subscriptions for this specific conversation
  useMessageSubscriptions({
    userId: user?.id,
    onNewMessage: useCallback((message) => {
      console.log('New message received:', message);
      if (conversation && 
          ((conversation.user1_id === message.sender_id && conversation.user2_id === message.recipient_id) ||
           (conversation.user1_id === message.recipient_id && conversation.user2_id === message.sender_id))) {
        console.log('Adding message to current conversation');
        addMessage(message);
        
        // Auto-scroll to bottom when new message arrives
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        // Mark as read if user is recipient and also mark as delivered
        if (message.recipient_id === user?.id) {
          markConversationAsRead(conversation.id);
          
          // Also mark sender's messages as delivered
          supabase.rpc('mark_messages_as_delivered', {
            recipient_user_id: user.id,
            sender_user_id: message.sender_id
          });
        }
      }
    }, [conversation, addMessage, markConversationAsRead, user?.id]),
    onMessageUpdate: useCallback((message) => {
      console.log('Message updated:', message);
      updateMessage(message);
    }, [updateMessage]),
    onConversationUpdate: useCallback(() => {
      console.log('Conversation updated, fetching conversations and messages');
      fetchConversations();
      // Also refresh current conversation messages
      if (conversation) {
        const otherUserId = conversation.user1_id === user?.id 
          ? conversation.user2_id 
          : conversation.user1_id;
        fetchMessages(otherUserId);
      }
    }, [fetchConversations, fetchMessages, conversation, user?.id]),
    activeConversationId: conversationId
  });

  useEffect(() => {
    if (!user || !conversationId) {
      navigate('/messages');
      return;
    }

    // Find the conversation
    const findConversation = async () => {
      setLoading(true);
      console.log('Finding conversation:', conversationId);
      
      try {
        // Direct database query for the conversation
        const { data: convData, error: convError } = await supabase
          .from('direct_conversations')
          .select('*')
          .eq('id', conversationId)
          .maybeSingle(); // Use maybeSingle to avoid errors if not found

        if (convError || !convData) {
          console.error('Conversation not found:', convError);
          navigate('/messages');
          return;
        }

        // Get the other user's profile
        const otherUserId = convData.user1_id === user.id ? convData.user2_id : convData.user1_id;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, phone')
          .eq('user_id', otherUserId)
          .maybeSingle();

        const formattedConversation = {
          ...convData,
          other_user_id: otherUserId,
          other_user_name: profileData?.full_name || 'Unknown User',
          other_user_avatar: profileData?.avatar_url || null,
          other_user_phone: profileData?.phone || null,
        };

        console.log('Conversation found:', formattedConversation);
        setConversation(formattedConversation);
        
        // Fetch messages for this conversation
        await fetchMessages(otherUserId);
        await markConversationAsRead(conversationId);
        
        // Mark messages as delivered when opening conversation
        try {
          await supabase.rpc('mark_messages_as_delivered', {
            recipient_user_id: user.id,
            sender_user_id: otherUserId
          });
        } catch (error) {
          console.log('Error marking messages as delivered:', error);
        }
        
      } catch (error) {
        console.error('Error loading conversation:', error);
        navigate('/messages');
      } finally {
        setLoading(false);
      }
    };

    findConversation();
  }, [conversationId, user?.id, navigate, fetchMessages, markConversationAsRead]);

  // Separate useEffect for polling to prevent re-initialization
  useEffect(() => {
    if (!conversation || !user || !conversationId) return;
    
    // Set up polling fallback for message updates
    const setupPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      const otherUserId = conversation.user1_id === user.id 
        ? conversation.user2_id 
        : conversation.user1_id;
      
      pollingIntervalRef.current = setInterval(() => {
        console.log('Polling for new messages...');
        fetchMessages(otherUserId);
      }, 5000); // Poll every 5 seconds (less aggressive)
    };
    
    setupPolling();
    
    // Cleanup polling on unmount or conversation change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [conversation?.id, user?.id, fetchMessages]);

  // Auto-scroll to bottom when messages change and mark messages as read
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Mark messages as read when they become visible
      if (conversation && user) {
        const unreadMessages = messages.filter(msg => 
          msg.recipient_id === user.id && 
          msg.status !== 'read'
        );
        
        unreadMessages.forEach(msg => {
          markMessageAsRead(msg.id);
        });
      }
    }
  }, [messages, conversation, user, markMessageAsRead]);

  // Auto-scroll to bottom after sending a message
  const handleSendMessage = async (content: string, attachments?: Array<{
    id: string;
    type: 'image' | 'video' | 'file';
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>) => {
    if (!conversation || !user) return;
    
    const recipientId = conversation.user1_id === user.id 
      ? conversation.user2_id 
      : conversation.user1_id;
    
    if (attachments && attachments.length > 0) {
      const success = await sendMessageWithAttachments(content, recipientId, attachments);
      if (success) {
        // Immediately refresh messages and auto-scroll
        fetchMessages(recipientId);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } else {
      const success = await sendMessage(content, recipientId);
      if (success) {
        // Immediately refresh messages and auto-scroll
        fetchMessages(recipientId);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }
  };

  const handleBack = () => {
    navigate('/messages');
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedMessages(new Set());
    }
  };

  const handleDeleteConversation = async () => {
    const success = await deleteConversation(conversationId || '');
    if (success) {
      navigate('/messages');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Conversation not found</p>
          <Button onClick={handleBack} variant="outline">Back to Messages</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="p-4 space-y-3">
          {/* Main header row with avatar, user info, and action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.other_user_avatar || undefined} />
                <AvatarFallback>
                  {getInitials(conversation.other_user_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold truncate">{conversation.other_user_name}</h1>
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.other_user_phone || 'No phone number'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Combined Call Button with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <PhoneCall className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50 bg-background border shadow-lg">
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={startVoiceCall}
                  >
                    <Phone className="h-4 w-4" />
                    Voice Call
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={startVideoCall}
                  >
                    <Video className="h-4 w-4" />
                    Video Call
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSelectionMode}
                className={isSelectionMode ? 'bg-primary text-primary-foreground' : ''}
              >
                <CheckSquare className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={handleDeleteConversation}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Last seen status on its own line */}
          <div className="text-xs text-muted-foreground pl-16">
            Last seen {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Full Screen Message Thread */}
      <div className="flex-1 flex flex-col">
        <MessageThread
          conversation={conversation}
          messages={messages}
          currentUserId={user?.id || ''}
          onSendMessage={handleSendMessage}
          showReadReceipts={true}
          messagesEndRef={messagesEndRef}
          isSelectionMode={isSelectionMode}
          selectedMessages={selectedMessages}
          onSelectedMessagesChange={setSelectedMessages}
          onMessageDeleted={() => {
            // Refetch messages when a message is deleted
            if (conversation) {
              const otherUserId = conversation.user1_id === user?.id 
                ? conversation.user2_id 
                : conversation.user1_id;
              fetchMessages(otherUserId);
            }
          }}
        />
      </div>

      {/* Video Call Dialog */}
      <VideoCallDialog
        open={isInCall}
        onOpenChange={() => {}}
        localStream={localStream}
        remoteStream={remoteStream}
        onEndCall={endCall}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        isVideoCall={isVideoCall}
        otherUserName={conversation?.other_user_name || 'Unknown User'}
        otherUserAvatar={conversation?.other_user_avatar}
      />

      {/* Incoming Call Dialog */}
      <IncomingCallDialog
        open={!!incomingCall}
        callerName={conversation?.other_user_name || 'Unknown User'}
        callerAvatar={conversation?.other_user_avatar}
        isVideoCall={incomingCall?.callType === 'video'}
        onAccept={answerCall}
        onDecline={declineCall}
      />
    </div>
  );
};

export default Chat;