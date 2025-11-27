import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import OnlineAvatar from '@/components/OnlineAvatar';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useConversations } from '@/hooks/useConversations';
import { usePresence } from '@/contexts/PresenceContext';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useWebRTCCall } from '@/hooks/messaging/useWebRTCCall';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Phone, Video, MoreVertical, Check as CheckSquare, Trash2, Phone as PhoneCall } from '@/lib/icons';
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
  const { isUserOnline } = usePresence();
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastConversationIdRef = useRef<string | null>(null);

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

  // Create refs after hooks are declared
  const fetchMessagesRef = useRef(fetchMessages);
  const markAsReadRef = useRef(markConversationAsRead);

  // Update refs when functions change
  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
    markAsReadRef.current = markConversationAsRead;
  }, [fetchMessages, markConversationAsRead]);

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

  // Memoized callbacks to prevent infinite re-renders
  const onNewMessage = useCallback((message) => {
    console.log('New message received:', message);
    if (conversation && 
        ((conversation.user1_id === message.sender_id && conversation.user2_id === message.recipient_id) ||
         (conversation.user1_id === message.recipient_id && conversation.user2_id === message.sender_id))) {
      console.log('Adding message to current conversation');
      addMessage(message);
      
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
  }, [conversation?.id, conversation?.user1_id, conversation?.user2_id, addMessage, markConversationAsRead, user?.id]);

  const onMessageUpdate = useCallback((message) => {
    console.log('Message updated:', message);
    updateMessage(message);
  }, [updateMessage]);

  const onConversationUpdate = useCallback(() => {
    console.log('Conversation updated, fetching conversations and messages');
    fetchConversations();
    // Also refresh current conversation messages
    if (conversation) {
      const otherUserId = conversation.user1_id === user?.id 
        ? conversation.user2_id 
        : conversation.user1_id;
      fetchMessages(otherUserId);
    }
  }, [fetchConversations, fetchMessages, conversation?.id, conversation?.user1_id, conversation?.user2_id, user?.id]);

  // Set up real-time subscriptions for this specific conversation
  useMessageSubscriptions({
    userId: user?.id,
    onNewMessage,
    onMessageUpdate,
    onConversationUpdate,
    activeConversationId: conversationId
  });

  useEffect(() => {
    if (!user || !conversationId) {
      navigate('/messages');
      return;
    }

    // Guard: Skip if we're already loading this conversation
    if (lastConversationIdRef.current === conversationId) {
      console.log('Already loading/loaded this conversation, skipping...');
      return;
    }

    lastConversationIdRef.current = conversationId;

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
        
        // Use refs to avoid dependency issues
        await fetchMessagesRef.current(otherUserId);
        await markAsReadRef.current(conversationId);
        
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
  }, [conversationId, user?.id, navigate]);

  // Reset guard when leaving the page
  useEffect(() => {
    return () => {
      lastConversationIdRef.current = null;
    };
  }, []);

  // Separate useEffect for polling to prevent re-initialization
  useEffect(() => {
    if (!conversation || !user || !conversationId) return;
    
    // Set up polling fallback for message updates
    const setupPolling = () => {
      // Polling disabled to prevent constant refreshes that were causing app instability
      console.log('Message polling disabled to prevent refresh loops');
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

  // Mark messages as read when they become visible
  useEffect(() => {
    if (messages.length > 0 && conversation && user) {
      const unreadMessages = messages.filter(msg => 
        msg.recipient_id === user.id && 
        msg.status !== 'read'
      );
      
      unreadMessages.forEach(msg => {
        markMessageAsRead(msg.id);
      });
    }
  }, [messages, conversation, user, markMessageAsRead]);

  // Send message and let MessageThread handle scrolling
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
        // Immediately refresh messages; MessageThread will auto-scroll on update
        fetchMessages(recipientId);
      }
    } else {
      const success = await sendMessage(content, recipientId);
      if (success) {
        // Immediately refresh messages; MessageThread will auto-scroll on update
        fetchMessages(recipientId);
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex-shrink-0">
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          {/* Main header row with avatar, user info, and action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              
              <OnlineAvatar
                userId={conversation.other_user_id}
                src={conversation.other_user_avatar || undefined}
                fallback={getInitials(conversation.other_user_name)}
                size="lg"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold truncate text-sm md:text-base">{conversation.other_user_name}</h1>
                  {isUserOnline(conversation.other_user_id) && (
                    <span className="text-xs text-green-500 font-medium">Online</span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {conversation.other_user_phone || 'No phone number'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              {/* Combined Call Button with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                    <PhoneCall className="h-4 w-4 md:h-5 md:w-5" />
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
                className={`h-8 w-8 md:h-10 md:w-10 ${isSelectionMode ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <CheckSquare className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                    <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
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
          <div className="text-xs text-muted-foreground pl-12 md:pl-16">
            Last seen {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Full Screen Message Thread */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
          onMarkAsRead={markMessageAsRead}
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