import { useEffect, useState, useRef } from 'react';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import UserSearch from './UserSearch';
import MessagingContacts from './MessagingContacts';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle, Users, Settings, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useReadStatus } from '@/hooks/useReadStatus';

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  user1_has_unread: boolean;
  user2_has_unread: boolean;
  created_at: string;
  otherUser?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  lastMessage?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
}

export interface MessagingPreferences {
  allow_messages: boolean;
  show_read_receipts: boolean;
  show_online_status: boolean;
}

const MessagingContent = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { markAllNotificationsAsRead } = useReadStatus();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [preferences, setPreferences] = useState<MessagingPreferences>({
    allow_messages: true,
    show_read_receipts: true,
    show_online_status: true,
  });
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newConversation, setNewConversation] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch messaging preferences
    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('messaging_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching messaging preferences:', error);
      } else if (data) {
        setPreferences(data);
      }
    };
    
    // Fetch all conversations
    const fetchConversations = async () => {
      setLoading(true);
      const { data: conversations, error } = await supabase
        .from('direct_conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
        return;
      }
      
      // Get other user details for each conversation
      const enhancedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          const otherUserId = conversation.user1_id === user.id 
            ? conversation.user2_id 
            : conversation.user1_id;
          
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('user_id', otherUserId)
            .single();
          
          if (userError) {
            console.error('Error fetching user profile:', userError);
            return conversation;
          }
          
          // Fetch last message
          const { data: lastMessageData } = await supabase
            .from('direct_messages')
            .select('content')
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1);
          
          return {
            ...conversation,
            otherUser: userData,
            lastMessage: lastMessageData && lastMessageData[0] ? lastMessageData[0].content : ''
          };
        })
      );
      
      setConversations(enhancedConversations);
      setLoading(false);
    };
    
    fetchPreferences();
    fetchConversations();
    
    // Set up safe real-time subscriptions for messages and conversations
    const messageSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
        }, (payload) => {
          console.log('MessagingContent: New message received:', payload);
          const newMessage = payload.new as Message;
          
          // Check if message belongs to any conversation (not just active one)
          const isMessageForUser = newMessage.sender_id === user.id || newMessage.recipient_id === user.id;
          
          // Always add the message to the messages state if it belongs to the active conversation
          if (activeConversation && isMessageForUser &&
              ((activeConversation.user1_id === newMessage.sender_id && activeConversation.user2_id === newMessage.recipient_id) ||
               (activeConversation.user1_id === newMessage.recipient_id && activeConversation.user2_id === newMessage.sender_id))) {
            
            console.log('MessagingContent: Adding message to active conversation');
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) {
                console.log('MessagingContent: Message already exists, skipping');
                return prev;
              }
              return [...prev, newMessage];
            });
            
            
            // Mark message as read if the current user is the recipient
            if (newMessage.recipient_id === user.id) {
              markMessageAsRead(newMessage.id);
            }
            
            // Scroll to bottom
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
          
          // Always update conversation list to reflect the latest activity
          fetchConversations();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
        }, (payload) => {
          console.log('MessagingContent: Message updated:', payload);
          const updatedMessage = payload.new as Message;
          
          // Update the message in the current conversation if it exists
          if (activeConversation && 
              ((activeConversation.user1_id === updatedMessage.sender_id && activeConversation.user2_id === updatedMessage.recipient_id) ||
               (activeConversation.user1_id === updatedMessage.recipient_id && activeConversation.user2_id === updatedMessage.sender_id))) {
            
            setMessages(prev => 
              prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
          }
        }),
      {
        channelName: 'messaging-messages',
        onError: () => {
          console.error('MessagingContent: Message subscription error');
          fetchConversations();
        },
        pollInterval: 30000,
        debugName: 'MessagingContent-messages'
      }
    );
    
    const conversationSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_conversations',
          filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`
        }, (payload) => {
          console.log('MessagingContent: Conversation updated:', payload);
          fetchConversations();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_conversations',
          filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`
        }, (payload) => {
          console.log('MessagingContent: New conversation created:', payload);
          fetchConversations();
        }),
      {
        channelName: 'messaging-conversations',
        onError: fetchConversations,
        pollInterval: 30000,
        debugName: 'MessagingContent-conversations'
      }
    );
    
    return () => {
      console.log('MessagingContent: Cleaning up subscriptions');
      messageSubscription?.unsubscribe();
      conversationSubscription?.unsubscribe();
      cleanupSafeSubscription('messaging-messages', 'MessagingContent-messages');
      cleanupSafeSubscription('messaging-conversations', 'MessagingContent-conversations');
    };
  }, [user]); // Only depend on user, not activeConversation

  // Fetch messages when active conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation || !user) return;
      
      const otherUserId = activeConversation.user1_id === user.id 
        ? activeConversation.user2_id 
        : activeConversation.user1_id;
      
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      setMessages(data || []);
      
      // Mark any unread messages as read
      if (activeConversation) {
        await supabase.rpc('mark_direct_messages_as_read', {
          conversation_id: activeConversation.id,
          current_user_id: user.id
        });
      }
      
      // Scroll to bottom of messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
    
    fetchMessages();
  }, [activeConversation, user]);

  // Mark a message as read
  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from('direct_messages')
      .update({ status: 'read' })
      .eq('id', messageId);
  };

  // Save messaging preferences
  const savePreferences = async (newPreferences: MessagingPreferences) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('messaging_preferences')
      .update(newPreferences)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update messaging preferences.",
        variant: "destructive",
      });
    } else {
      setPreferences(newPreferences);
      toast({
        title: "Settings updated",
        description: "Your messaging preferences have been saved.",
      });
    }
  };

  // Send a message
  const sendMessage = async (content: string, recipientId: string) => {
    if (!user || !content.trim()) return;
    
    // Check if recipient allows messages
    const { data: allowsMessagesData } = await supabase
      .rpc('user_allows_direct_messages', { target_user_id: recipientId });
    
    const allowsMessages = allowsMessagesData;
    
    if (!allowsMessages) {
      toast({
        title: "Cannot send message",
        description: "This user is not accepting direct messages.",
        variant: "destructive",
      });
      return;
    }
    
    const message = {
      sender_id: user.id,
      recipient_id: recipientId,
      content: content.trim(),
      status: 'sent' as const
    };
    
    const { error } = await supabase
      .from('direct_messages')
      .insert(message);
    
    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle clicking on a conversation
  const handleConversationClick = (conversation: Conversation) => {
    setActiveConversation(conversation);
    setNewConversation(false);
  };

  // Start a new conversation
  const startNewConversation = () => {
    setActiveConversation(null);
    setNewConversation(true);
    setMessages([]);
  };

  // Handle user selection for a new conversation
  const handleUserSelect = async (selectedUser: { id: string; user_id: string; full_name: string | null; }) => {
    if (!user) return;
    
    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('direct_conversations')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${selectedUser.user_id}),and(user1_id.eq.${selectedUser.user_id},user2_id.eq.${user.id})`)
      .single();
    
    if (existingConversation) {
      setActiveConversation({
        ...existingConversation,
        otherUser: {
          id: selectedUser.id,
          full_name: selectedUser.full_name,
          avatar_url: null
        }
      });
      setNewConversation(false);
    } else {
      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('direct_conversations')
        .insert({
          user1_id: user.id,
          user2_id: selectedUser.user_id,
          last_message_at: new Date().toISOString(),
          user1_has_unread: false,
          user2_has_unread: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating conversation:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      setActiveConversation({
        ...newConversation,
        otherUser: {
          id: selectedUser.id,
          full_name: selectedUser.full_name,
          avatar_url: null
        }
      });
      setNewConversation(false);
    }
  };

  // Handle starting conversation from contacts
  const handleStartConversationFromContacts = async (userId: string, contactName: string) => {
    if (!user) return;
    
    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('direct_conversations')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
      .single();
    
    if (existingConversation) {
      setActiveConversation({
        ...existingConversation,
        otherUser: {
          id: userId,
          full_name: contactName,
          avatar_url: null
        }
      });
    } else {
      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('direct_conversations')
        .insert({
          user1_id: user.id,
          user2_id: userId,
          last_message_at: new Date().toISOString(),
          user1_has_unread: false,
          user2_has_unread: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating conversation:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      setActiveConversation({
        ...newConversation,
        otherUser: {
          id: userId,
          full_name: contactName,
          avatar_url: null
        }
      });
    }
    
    setNewConversation(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={markAllNotificationsAsRead}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Clear Notifications
          </Button>
          <Button
            onClick={startNewConversation}
            size="sm"
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            New Message
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="conversations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conversations" className="space-y-4">
          <div className="flex flex-col md:flex-row h-[70vh] gap-4">
            <div className="w-full md:w-1/3 border rounded-md overflow-hidden">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ConversationList 
                  conversations={conversations}
                  activeConversation={activeConversation}
                  onConversationClick={handleConversationClick}
                  currentUserId={user?.id}
                />
              )}
            </div>
            
            <div className="w-full md:w-2/3 border rounded-md overflow-hidden">
              {activeConversation ? (
                <MessageThread
                  conversation={activeConversation}
                  messages={messages}
                  currentUserId={user?.id}
                  onSendMessage={(content) => sendMessage(content, activeConversation.user1_id === user?.id ? activeConversation.user2_id : activeConversation.user1_id)}
                  showReadReceipts={preferences.show_read_receipts}
                  messagesEndRef={messagesEndRef}
                />
              ) : newConversation ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-medium">New Conversation</h3>
                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={() => setNewConversation(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-4 flex-grow overflow-auto">
                    <UserSearch onUserSelect={handleUserSelect} />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-6">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No conversation selected</h3>
                    <p className="text-muted-foreground">
                      Select a conversation from the list or start a new one
                    </p>
                    <Button
                      onClick={startNewConversation}
                      className="bg-gradient-primary hover:opacity-90 transition-opacity"
                    >
                      Start New Conversation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="contacts" className="space-y-4">
          <MessagingContacts onStartConversation={handleStartConversationFromContacts} />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <div className="border rounded-md overflow-hidden p-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5" />
              <h2 className="text-xl font-bold">Messaging Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium">Allow Direct Messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Let other users message you directly
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow-messages"
                    checked={preferences.allow_messages}
                    onChange={(e) => savePreferences({ ...preferences, allow_messages: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-primary rounded border-gray-300"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium">Show Read Receipts</h3>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you've read their messages
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="read-receipts"
                    checked={preferences.show_read_receipts}
                    onChange={(e) => savePreferences({ ...preferences, show_read_receipts: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-primary rounded border-gray-300"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium">Show Online Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you're active
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="online-status"
                    checked={preferences.show_online_status}
                    onChange={(e) => savePreferences({ ...preferences, show_online_status: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-primary rounded border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagingContent;