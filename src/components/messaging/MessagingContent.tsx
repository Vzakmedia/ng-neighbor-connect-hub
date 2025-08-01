import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Search, Settings, Users, Bell, BellOff, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages, type Message } from '@/hooks/useDirectMessages';
import { useConversations, type Conversation } from '@/hooks/useConversations';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useToast } from '@/hooks/use-toast';
import { useReadStatus } from '@/hooks/useReadStatus';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import MessageThread from './MessageThread';
import UserSearch from './UserSearch';
import MessagingContacts from './MessagingContacts';

interface MessagingPreferences {
  allow_messages: boolean;
  show_read_receipts: boolean;
  show_online_status: boolean;
}

const MessagingContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { markAllNotificationsAsRead } = useReadStatus();
  const isMobile = useIsMobile();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showMobileConversationList, setShowMobileConversationList] = useState(true);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [messagingPreferences, setMessagingPreferences] = useState<MessagingPreferences>({
    allow_messages: true,
    show_read_receipts: true,
    show_online_status: true
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const { 
    messages, 
    fetchMessages, 
    sendMessage: sendDirectMessage, 
    markConversationAsRead,
    addMessage,
    updateMessage 
  } = useDirectMessages(user?.id);

  const { 
    conversations, 
    loading: conversationsLoading, 
    fetchConversations,
    markConversationAsRead: markConvAsRead
  } = useConversations(user?.id);

  const unreadCount = useUnreadMessages();

  // Set up real-time subscriptions
  useMessageSubscriptions({
    userId: user?.id,
    onNewMessage: (message) => {
      // Check if message belongs to active conversation
      if (activeConversation && 
          ((activeConversation.user1_id === message.sender_id && activeConversation.user2_id === message.recipient_id) ||
           (activeConversation.user1_id === message.recipient_id && activeConversation.user2_id === message.sender_id))) {
        addMessage(message);
        
        // Mark as read if user is recipient
        if (message.recipient_id === user?.id) {
          markConversationAsRead(activeConversation.id);
        }
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      // Always refresh conversation list
      fetchConversations();
    },
    onMessageUpdate: updateMessage,
    onConversationUpdate: fetchConversations,
    activeConversationId: activeConversation?.id
  });

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchMessagingPreferences();
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (activeConversation && user) {
      const otherUserId = activeConversation.user1_id === user.id 
        ? activeConversation.user2_id 
        : activeConversation.user1_id;
      fetchMessages(otherUserId);
      markConvAsRead(activeConversation.id);
    }
  }, [activeConversation, user, fetchMessages, markConvAsRead]);

  const fetchMessagingPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messaging_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching messaging preferences:', error);
      } else if (data) {
        setMessagingPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching messaging preferences:', error);
    }
  };

  const saveMessagingPreferences = async (newPreferences: MessagingPreferences) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messaging_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences
        });
      
      if (error) throw error;
      
      setMessagingPreferences(newPreferences);
      toast({
        title: "Settings saved",
        description: "Your messaging preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving messaging preferences:', error);
      toast({
        title: "Error",
        description: "Could not save preferences.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversation || !user) return;
    
    const recipientId = activeConversation.user1_id === user.id 
      ? activeConversation.user2_id 
      : activeConversation.user1_id;
    
    await sendDirectMessage(content, recipientId);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowMobileConversationList(false);
    }
  };

  const handleBackToConversations = () => {
    setActiveConversation(null);
    setShowMobileConversationList(true);
  };

  const clearAllNotifications = async () => {
    await markAllNotificationsAsRead();
    toast({
      title: "Notifications cleared",
      description: "All message notifications have been marked as read.",
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Please sign in to access messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Mobile: Show conversation list or message thread */}
      {isMobile ? (
        <>
          {showMobileConversationList ? (
            <div className="w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Messages</h2>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="text-xs"
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Clear ({unreadCount})
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewMessageDialog(true)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100vh-10rem)]">
                {conversationsLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading conversations...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No conversations yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowNewMessageDialog(true)}
                    >
                      Start a conversation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((conversation) => {
                      const hasUnread = conversation.user1_id === user.id 
                        ? conversation.user1_has_unread 
                        : conversation.user2_has_unread;
                      
                      return (
                        <div
                          key={conversation.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => handleConversationSelect(conversation)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.other_user_avatar || undefined} />
                            <AvatarFallback>
                              {getInitials(conversation.other_user_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">
                                {conversation.other_user_name}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                              </span>
                            </div>
                            {hasUnread && (
                              <Badge variant="secondary" className="mt-1">
                                New message
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="w-full">
              {activeConversation && (
                <MessageThread
                  conversation={activeConversation}
                  messages={messages}
                  currentUserId={user.id}
                  onSendMessage={handleSendMessage}
                  showReadReceipts={messagingPreferences.show_read_receipts}
                  messagesEndRef={messagesEndRef}
                  onBack={handleBackToConversations}
                />
              )}
            </div>
          )}
        </>
      ) : (
        /* Desktop: Show both panels */
        <>
          {/* Conversations Panel */}
          <div className="w-1/3 border-r">
            <Tabs defaultValue="conversations" className="h-full">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Messages</h2>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                    >
                      <BellOff className="h-4 w-4 mr-2" />
                      Clear ({unreadCount})
                    </Button>
                  )}
                </div>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="conversations">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chats
                  </TabsTrigger>
                  <TabsTrigger value="contacts">
                    <Users className="h-4 w-4 mr-2" />
                    Contacts
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="conversations" className="h-[calc(100%-8rem)] mt-0">
                <ScrollArea className="h-full">
                  {conversationsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading conversations...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No conversations yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setShowNewMessageDialog(true)}
                      >
                        Start a conversation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {conversations.map((conversation) => {
                        const hasUnread = conversation.user1_id === user.id 
                          ? conversation.user1_has_unread 
                          : conversation.user2_has_unread;
                        const isActive = activeConversation?.id === conversation.id;
                        
                        return (
                          <div
                            key={conversation.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              isActive ? 'bg-primary/10' : 'hover:bg-muted'
                            }`}
                            onClick={() => handleConversationSelect(conversation)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.other_user_avatar || undefined} />
                              <AvatarFallback>
                                {getInitials(conversation.other_user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">
                                  {conversation.other_user_name}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                                </span>
                              </div>
                              {hasUnread && (
                                <Badge variant="secondary" className="mt-1">
                                  New message
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="contacts" className="h-[calc(100%-8rem)] mt-0">
                <MessagingContacts onStartConversation={() => setShowNewMessageDialog(true)} />
              </TabsContent>

              <TabsContent value="settings" className="h-[calc(100%-8rem)] mt-0">
                <div className="p-4 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="allow-messages">Allow messages</Label>
                      <Switch
                        id="allow-messages"
                        checked={messagingPreferences.allow_messages}
                        onCheckedChange={(checked) => 
                          saveMessagingPreferences({
                            ...messagingPreferences,
                            allow_messages: checked
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="read-receipts">Show read receipts</Label>
                      <Switch
                        id="read-receipts"
                        checked={messagingPreferences.show_read_receipts}
                        onCheckedChange={(checked) => 
                          saveMessagingPreferences({
                            ...messagingPreferences,
                            show_read_receipts: checked
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="online-status">Show online status</Label>
                      <Switch
                        id="online-status"
                        checked={messagingPreferences.show_online_status}
                        onCheckedChange={(checked) => 
                          saveMessagingPreferences({
                            ...messagingPreferences,
                            show_online_status: checked
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Message Thread Panel */}
          <div className="flex-1">
            {activeConversation ? (
              <MessageThread
                conversation={activeConversation}
                messages={messages}
                currentUserId={user.id}
                onSendMessage={handleSendMessage}
                showReadReceipts={messagingPreferences.show_read_receipts}
                messagesEndRef={messagesEndRef}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowNewMessageDialog(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start new conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showNewMessageDialog && (
        <UserSearch 
          onUserSelect={(user) => {
            // Create or find conversation and switch to it
            setShowNewMessageDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default MessagingContent;
export type { Conversation, Message, MessagingPreferences };