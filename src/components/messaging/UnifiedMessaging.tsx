import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, type Conversation } from '@/hooks/useConversations';
import { useDirectMessages, type Message } from '@/hooks/useDirectMessages';
import { useMessageSubscriptions } from '@/hooks/useMessageSubscriptions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ConversationList from '@/components/messaging/ConversationList';
import MessageThread from '@/components/messaging/MessageThread';
import { MessageRequestsList } from '@/components/messaging/MessageRequestsList';
import { MarketplaceMessaging } from '@/components/messaging/MarketplaceMessaging';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Search, MessageCircle, ShoppingBag, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RealtimeDebugPanel from '@/components/messaging/RealtimeDebugPanel';

const UnifiedMessaging = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversations, loading: conversationsLoading, fetchConversations, createOrFindConversation, markConversationAsRead } = useConversations(user?.id);
  const { messages, fetchMessages, sendMessage, sendMessageWithAttachments, addMessage, updateMessage, markMessageAsRead } = useDirectMessages(user?.id);

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState('direct');
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchRequestCount();
    }
  }, [user, fetchConversations]);

  const fetchRequestCount = async () => {
    if (!user) return;
    
    try {
      const { count } = await supabase
        .from('direct_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user2_id', user.id)
        .eq('request_status', 'pending')
        .eq('conversation_type', 'direct_message');
      
      setRequestCount(count || 0);
    } catch (error) {
      console.error('Error fetching request count:', error);
    }
  };

  // Keep activeConversation in sync if list updates
  useEffect(() => {
    if (!activeConversation || conversations.length === 0) return;
    const updated = conversations.find(c => c.id === activeConversation.id);
    if (updated) setActiveConversation(updated);
  }, [conversations, activeConversation?.id]);

  const otherUserId = useMemo(() => {
    if (!user || !activeConversation) return undefined;
    return activeConversation.user1_id === user.id ? activeConversation.user2_id : activeConversation.user1_id;
  }, [user?.id, activeConversation?.id]);

  const selectConversation = useCallback(async (conv: Conversation) => {
    if (window.innerWidth < 1280) {
      // On small screens, use full chat page
      navigate(`/chat/${conv.id}`);
      return;
    }
    setActiveConversation(conv);
    const targetUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
    await fetchMessages(targetUserId);
    await markConversationAsRead(conv.id);
  }, [navigate, user?.id, fetchMessages, markConversationAsRead]);

  const onNewMessage = useCallback((message: Message) => {
    if (!activeConversation) {
      // Ensure list reflects unread states
      fetchConversations();
      return;
    }
    const belongsToActive = (message.sender_id === activeConversation.user1_id && message.recipient_id === activeConversation.user2_id) ||
                            (message.sender_id === activeConversation.user2_id && message.recipient_id === activeConversation.user1_id);
    if (belongsToActive) {
      addMessage(message);
      // If user is recipient, mark as read and deliver older sent messages
      if (user && message.recipient_id === user.id) {
        markConversationAsRead(activeConversation.id);
        (async () => {
          try {
            await supabase.rpc('mark_messages_as_delivered', {
              recipient_user_id: user.id,
              sender_user_id: message.sender_id
            });
          } catch {}
        })();
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      // Refresh list to update unread badges
      fetchConversations();
    }
  }, [activeConversation?.id, activeConversation?.user1_id, activeConversation?.user2_id, user?.id, addMessage, markConversationAsRead, fetchConversations]);

  const onMessageUpdate = useCallback((message: Message) => {
    updateMessage(message);
  }, [updateMessage]);

  const onConversationUpdate = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  useMessageSubscriptions({
    userId: user?.id,
    onNewMessage,
    onMessageUpdate,
    onConversationUpdate
  });

  const handleSendMessage = async (content: string, attachments?: Array<{ id: string; type: 'image' | 'video' | 'file'; name: string; url: string; size: number; mimeType: string; }>) => {
    if (!activeConversation || !user) return;
    const recipientId = activeConversation.user1_id === user.id ? activeConversation.user2_id : activeConversation.user1_id;

    let success = false;
    if (attachments && attachments.length > 0) {
      success = await sendMessageWithAttachments(content, recipientId, attachments);
    } else {
      success = await sendMessage(content, recipientId);
    }
    if (success) {
      await fetchMessages(recipientId);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  };

  const performUserSearch = async (query: string) => {
    if (!query.trim() || !user) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      // Use secure function for user search
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .or(`full_name.ilike.%${query}%`)
        .neq('user_id', user.id)
        .limit(5);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversationWithUser = async (targetUserId: string) => {
    const convId = await createOrFindConversation(targetUserId);
    if (!convId) return;
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      await selectConversation(conv);
    } else {
      await fetchConversations();
      const newConv = conversations.find(c => c.id === convId);
      if (newConv) await selectConversation(newConv);
      else navigate(`/chat/${convId}`);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const handleRequestAccepted = (conversationId: string) => {
    fetchConversations();
    fetchRequestCount();
  };

  useEffect(() => {
    document.title = 'Messages | Conversations';
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="px-4 py-2 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="direct" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Requests</span>
              {requestCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {requestCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Marketplace</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0">
          <TabsContent value="direct" className="h-full m-0">
            <div className="grid grid-cols-1 xl:grid-cols-5 h-full">
              {/* Left: conversations + search */}
              <div className="xl:col-span-2 border-r flex flex-col min-h-0">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search people by name or phone"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim()) performUserSearch(e.target.value);
                        else setSearchResults([]);
                      }}
                      className="pl-10"
                    />
                  </div>
                  {searchQuery && (
                    <div className="mt-2 bg-background border rounded-lg shadow-sm max-h-56 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-3 text-xs text-muted-foreground">Searching…</div>
                      ) : searchResults.length > 0 ? (
                        <div className="divide-y">
                          {searchResults.map((u) => (
                            <button key={u.user_id} onClick={() => startConversationWithUser(u.user_id)} className="w-full p-2 flex items-center gap-3 hover:bg-muted">
                              <OnlineAvatar userId={u.user_id} src={u.avatar_url || undefined} fallback={getInitials(u.full_name)} size="md" />
                              <div className="text-left">
                                <div className="text-sm font-medium">{u.full_name}</div>
                                <div className="text-xs text-muted-foreground">{u.phone}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-xs text-muted-foreground">No results</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-h-0">
                  <ConversationList
                    conversations={conversations}
                    loading={conversationsLoading}
                    activeConversationId={activeConversation?.id}
                    currentUserId={user?.id}
                    onConversationSelect={selectConversation}
                  />
                </div>
              </div>

              {/* Right: thread (xl and up) */}
              <div className="hidden xl:flex xl:col-span-3 min-h-0">
                {activeConversation ? (
                  <MessageThread
                    conversation={activeConversation}
                    messages={messages}
                    currentUserId={user?.id}
                    onSendMessage={handleSendMessage}
                    showReadReceipts={true}
                    messagesEndRef={messagesEndRef}
                    onMessageDeleted={() => {
                      if (otherUserId) fetchMessages(otherUserId);
                    }}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p className="text-sm">Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="h-full m-0">
            <MessageRequestsList onRequestAccepted={handleRequestAccepted} />
          </TabsContent>

          <TabsContent value="marketplace" className="h-full m-0">
            <MarketplaceMessaging />
          </TabsContent>
        </div>
      </Tabs>
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="secondary" size="sm" onClick={() => setShowDebug(true)}>
          Debug
        </Button>
      </div>
      {showDebug && (
        <RealtimeDebugPanel open={showDebug} onClose={() => setShowDebug(false)} />
      )}
    </div>
  );
};

export default UnifiedMessaging;
