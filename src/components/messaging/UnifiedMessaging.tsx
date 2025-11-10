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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const UnifiedMessaging = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastConversationUpdateRef = useRef<number>(0);
  const hasInitialFetchRef = useRef(false);
  const conversationsRef = useRef<Conversation[]>([]);
  const onNewMessageRef = useRef<((message: Message) => void) | null>(null);
  const onMessageUpdateRef = useRef<((message: Message) => void) | null>(null);
  const onConversationUpdateRef = useRef<(() => void) | null>(null);
  const onReadReceiptRef = useRef<((messageId: string) => void) | null>(null);

  const { conversations, loading: conversationsLoading, fetchConversations, createOrFindConversation, markConversationAsRead } = useConversations(user?.id);
  const { messages, fetchMessages, fetchOlderMessages, loadingOlder, hasMoreMessages, sendMessage, sendMessageWithAttachments, addMessage, updateMessage, markMessageAsRead, retryMessage } = useDirectMessages(user?.id);

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('direct');
  const [requestCount, setRequestCount] = useState(0);

  // Step 1: Fix infinite loop - only fetch once on mount
  useEffect(() => {
    if (user && !hasInitialFetchRef.current) {
      console.time('InitialFetch');
      hasInitialFetchRef.current = true;
      fetchConversations();
      fetchRequestCount();
      console.timeEnd('InitialFetch');
    }
  }, [user]); // Removed fetchConversations from dependencies

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

  // Step 2: REMOVED - Don't sync activeConversation automatically
  // This was causing constant re-renders on mobile
  
  // Keep conversationsRef in sync
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

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

  // Step 3: Stabilize onNewMessage using conversationsRef
  const onNewMessage = useCallback((message: Message) => {
    if (!activeConversation) {
      // Don't fetch conversations on mobile - let user manually refresh
      const isMobile = window.innerWidth < 768;
      if (isMobile) return;
      
      // Use ref to avoid dependency on conversations array
      const existingConv = conversationsRef.current.find(c => 
        (c.user1_id === message.sender_id && c.user2_id === message.recipient_id) ||
        (c.user1_id === message.recipient_id && c.user2_id === message.sender_id)
      );
      if (!existingConv) {
        fetchConversations(); // Only fetch if truly new
      }
      return;
    }
    const belongsToActive = (message.sender_id === activeConversation.user1_id && message.recipient_id === activeConversation.user2_id) ||
                            (message.sender_id === activeConversation.user2_id && message.recipient_id === activeConversation.user1_id);
    if (belongsToActive) {
      // Append message directly to state - no refetch needed
      addMessage(message);
      // If user is recipient, mark as read
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
      const isMobile = window.innerWidth < 768;
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ 
        behavior: isMobile ? 'auto' : 'smooth' 
      }), 100);
    }
    // Don't refresh conversation list on mobile for other messages
  }, [activeConversation?.id, activeConversation?.user1_id, activeConversation?.user2_id, user?.id, addMessage, markConversationAsRead, fetchConversations]); // Removed 'conversations'

  const onMessageUpdate = useCallback((message: Message) => {
    updateMessage(message);
  }, [updateMessage]);

  // Step 6: Prevent conversation list updates on mobile completely
  const onConversationUpdate = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    
    // On mobile, NEVER update conversation list while chatting
    if (isMobile) {
      console.log('Blocked conversation update on mobile');
      return;
    }
    
    // Desktop: still use debouncing
    const debounceTime = 500;
    const now = Date.now();
    
    if (now - lastConversationUpdateRef.current < debounceTime) {
      console.log('Skipping conversation update - debounced');
      return;
    }
    lastConversationUpdateRef.current = now;
    fetchConversations();
  }, [fetchConversations]); // Removed activeConversation dependency

  // Step 4: Fix onReadReceipt to not depend on messages array
  const onReadReceipt = useCallback((messageId: string) => {
    // Just update the status directly without dependencies
    updateMessage({ id: messageId, status: 'read' } as Message);
  }, [updateMessage]); // No messages dependency

  // Update refs when callbacks change
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onMessageUpdateRef.current = onMessageUpdate;
    onConversationUpdateRef.current = onConversationUpdate;
    onReadReceiptRef.current = onReadReceipt;
  }, [onNewMessage, onMessageUpdate, onConversationUpdate, onReadReceipt]);

  // Stable subscription callbacks using refs (messages handled by useDirectMessages broadcast)
  useMessageSubscriptions({
    userId: user?.id,
    onNewMessage: useCallback(() => {}, []), // No-op: handled by useDirectMessages
    onMessageUpdate: useCallback(() => {}, []), // No-op: handled by useDirectMessages
    onConversationUpdate: useCallback(() => onConversationUpdateRef.current?.(), []),
    onReadReceipt: useCallback((id: string) => onReadReceiptRef.current?.(id), [])
  });

  const handleSendMessage = async (content: string, attachments?: Array<{ id: string; type: 'image' | 'video' | 'file'; name: string; url: string; size: number; mimeType: string; }>) => {
    if (!activeConversation || !user) return;
    const recipientId = activeConversation.user1_id === user.id ? activeConversation.user2_id : activeConversation.user1_id;

    // Backend operation - no optimistic UI here, sendMessage handles it
    try {
      let success = false;
      if (attachments && attachments.length > 0) {
        success = await sendMessageWithAttachments(content, recipientId, attachments);
      } else {
        success = await sendMessage(content, recipientId);
      }

      if (!success) throw new Error('Failed to send message');

      // Don't refetch - real-time subscription will update the message
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      toast({
        title: "Failed to send",
        description: "Your message couldn't be sent. Please try again.",
        variant: "destructive",
      });
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
          <TabsList className="flex mb-4 justify-start">
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
            {/* Mobile: show only conversation list */}
            <div className="xl:hidden h-full">
              <div className="border-r flex flex-col min-h-0 h-full">
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
            </div>

            {/* Desktop: resizable panels */}
            <ResizablePanelGroup direction="horizontal" className="hidden xl:flex h-full w-full">
              {/* Left: conversations + search */}
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="border-r">
                <div className="flex flex-col h-full w-full">
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
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ConversationList
                      conversations={conversations}
                      loading={conversationsLoading}
                      activeConversationId={activeConversation?.id}
                      currentUserId={user?.id}
                      onConversationSelect={selectConversation}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

              {/* Right: thread */}
              <ResizablePanel defaultSize={75} minSize={40}>
                <div className="flex h-full w-full">
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
                      onRetryMessage={retryMessage}
                      onLoadOlder={() => {
                        if (otherUserId) fetchOlderMessages(otherUserId);
                      }}
                      loadingOlder={loadingOlder}
                      hasMoreMessages={hasMoreMessages}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">Select a conversation to start chatting</p>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>

          <TabsContent value="requests" className="h-full m-0">
            <MessageRequestsList onRequestAccepted={handleRequestAccepted} />
          </TabsContent>

          <TabsContent value="marketplace" className="h-full m-0">
            <MarketplaceMessaging />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default UnifiedMessaging;
