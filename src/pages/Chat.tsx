import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useConversations } from '@/hooks/useConversations';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import MessageThread from '@/components/messaging/MessageThread';

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { 
    messages, 
    fetchMessages, 
    sendMessage,
    markConversationAsRead,
    addMessage,
    updateMessage 
  } = useDirectMessages(user?.id);

  const { conversations, fetchConversations } = useConversations(user?.id);

  // Set up real-time subscriptions for this specific conversation
  useMessageSubscriptions({
    userId: user?.id,
    onNewMessage: (message) => {
      if (conversation && 
          ((conversation.user1_id === message.sender_id && conversation.user2_id === message.recipient_id) ||
           (conversation.user1_id === message.recipient_id && conversation.user2_id === message.sender_id))) {
        addMessage(message);
        
        // Mark as read if user is recipient
        if (message.recipient_id === user?.id) {
          markConversationAsRead(conversation.id);
        }
      }
    },
    onMessageUpdate: updateMessage,
    onConversationUpdate: fetchConversations,
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
          .single();

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
          .single();

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
        
      } catch (error) {
        console.error('Error loading conversation:', error);
        navigate('/messages');
      } finally {
        setLoading(false);
      }
    };

    findConversation();
  }, [conversationId, user?.id, navigate]);

  const handleSendMessage = async (content: string) => {
    if (!conversation || !user) return;
    
    const recipientId = conversation.user1_id === user.id 
      ? conversation.user2_id 
      : conversation.user1_id;
    
    await sendMessage(content, recipientId);
  };

  const handleBack = () => {
    navigate('/messages');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Conversation not found</p>
          <Button onClick={handleBack}>Back to Messages</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
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
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
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
          messagesEndRef={null}
        />
      </div>
    </div>
  );
};

export default Chat;