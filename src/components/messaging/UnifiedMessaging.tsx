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
import { Search, MessageCircle, ShoppingBag, UserPlus } from '@/lib/icons';
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
  const isStartingConversationRef = useRef(false);

  const { conversations, loading: conversationsLoading, fetchConversations, createOrFindConversation, markConversationAsRead, setConversations } = useConversations(user?.id);
  const { messages, fetchMessages, fetchMissedMessages, fetchOlderMessages, loadingOlder, hasMoreMessages, sendMessage, sendMessageWithAttachments, addMessage, updateMessage, markMessageAsRead, retryMessage, setActiveConversationId } = useDirectMessages(user?.id);

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

  // Fix 5: Remove unnecessary effect - update ref during render instead
  conversationsRef.current = conversations;

  const otherUserId = useMemo(() => {
    if (!user || !activeConversation) return undefined;
    return activeConversation.user1_id === user.id ? activeConversation.user2_id : activeConversation.user1_id;
  }, [user?.id, activeConversation?.id]);

  const selectConversation = useCallback(async (conv: Conversation) => {
    if (window.innerWidth < 640) {
      // On mobile, navigate to full chat page
      navigate(`/chat/${conv.id}`);
      return;
    }
    setActiveConversation(conv);
    setActiveConversationId(conv.id);
    const targetUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
    await fetchMessages(targetUserId);
    await markConversationAsRead(conv.id);
  }, [navigate, user?.id, fetchMessages, markConversationAsRead, setActiveConversationId]);

  // No-op: Message handling moved to useDirectMessages broadcast channel
  const onNewMessage = useCallback((message: Message) => {
    // This is now a no-op - messages are handled by useDirectMessages
  }, []);

  const onMessageUpdate = useCallback((message: Message) => {
    updateMessage(message);
  }, [updateMessage]);

  // ENABLED: Conversation updates with proper debouncing (300ms)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onConversationUpdate = useCallback(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce conversation refetch - only refetch after 300ms of no updates
    debounceTimerRef.current = setTimeout(() => {
      console.log('[onConversationUpdate] Refetching conversations (debounced)');
      fetchConversations();
      fetchRequestCount();
    }, 300);
  }, [fetchConversations, fetchRequestCount]);

  // Step 4: Fix onReadReceipt to not depend on messages array
  const onReadReceipt = useCallback((messageId: string) => {
    // Just update the status directly without dependencies
    updateMessage({ id: messageId, status: 'read' } as Message);
  }, [updateMessage]); // No messages dependency

  // Consolidated ref updates - single effect
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
    onConversationUpdate: onConversationUpdate, // Re-enabled with debouncing
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
    console.log('[startConversation] Starting with user:', targetUserId);
    console.log('[startConversation] Current conversations count:', conversations.length);
    
    // Guard: Prevent multiple simultaneous calls
    if (isStartingConversationRef.current) {
      console.warn('[startConversation] BLOCKED: Already in progress');
      return;
    }
    
    isStartingConversationRef.current = true;
    
    try {
      console.log('[startConversation] Creating/finding conversation...');
      const convId = await createOrFindConversation(targetUserId);
      
      if (!convId) {
        console.error('[startConversation] Failed to get conversation ID');
        return;
      }
      
      console.log('[startConversation] Conversation ID:', convId);
      
      // First check current conversations
      let conv = conversations.find(c => c.id === convId);
      
      if (conv) {
        console.log('[startConversation] Found in current state, selecting...');
        await selectConversation(conv);
        setSearchQuery('');
        setSearchResults([]);
        console.log('[startConversation] ✅ Complete (found in state)');
        return; // ✅ CRITICAL: Exit here to prevent unnecessary fetch
      }
      
      console.log('[startConversation] Not in current state, fetching fresh data...');
      const freshConversations = await fetchConversations();
      console.log('[startConversation] Fetched conversations:', freshConversations.length);
      
      conv = freshConversations.find(c => c.id === convId);
      
      if (conv) {
        console.log('[startConversation] Found in fresh data, selecting...');
        await selectConversation(conv);
        console.log('[startConversation] ✅ Complete (found in fresh data)');
      } else {
        console.warn('[startConversation] Not found even after fetch, navigating directly...');
        navigate(`/chat/${convId}`);
        console.log('[startConversation] ✅ Complete (navigated)');
      }
      
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('[startConversation] Error:', error);
    } finally {
      isStartingConversationRef.current = false;
      console.log('[startConversation] Guard released');
    }
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
        <div className="px-4 py-3 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="direct" className="flex items-center gap-1.5 sm:gap-2">
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-1.5 sm:gap-2">
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Requests</span>
              {requestCount > 0 && (
                <Badge variant="secondary" className="ml-1 shrink-0">
                  {requestCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-1.5 sm:gap-2">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Marketplace</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0">
          <TabsContent value="direct" className="h-full m-0">
            {/* Mobile/Tablet: show only conversation list */}
            <div className="sm:hidden h-full">
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

            {/* Desktop only: resizable panels (640px+) */}
            <ResizablePanelGroup direction="horizontal" className="hidden sm:flex h-full w-full">
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
