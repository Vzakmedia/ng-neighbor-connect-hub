import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, type Conversation } from '@/hooks/useConversations';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useToast } from '@/hooks/use-toast';
import { useReadStatus } from '@/hooks/useReadStatus';
import { supabase } from '@/integrations/supabase/client';

const MessagingContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { markAllNotificationsAsRead } = useReadStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  

  const { 
    conversations, 
    loading: conversationsLoading, 
    fetchConversations,
    createOrFindConversation,
    setConversations
  } = useConversations(user?.id);

  const unreadCount = useUnreadMessages();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  const handleConversationSelect = (conversation: Conversation) => {
    // Navigate to full screen chat page
    navigate(`/chat/${conversation.id}`);
  };

  const performUserSearch = async (query: string) => {
    if (!query.trim() || !user) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, phone')
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .neq('user_id', user.id)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      performUserSearch(value);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const startConversationWithUser = async (userId: string) => {
    const conversationId = await createOrFindConversation(userId);
    if (conversationId) {
      // Navigate to the new conversation
      navigate(`/chat/${conversationId}`);
    }
    setSearchQuery('');
    setSearchResults([]);
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
          </div>
        </div>

        {/* Search Section */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Start typing to search for users..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Search Results */}
          {searchQuery && (
            <div className="mt-2 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-center text-muted-foreground text-sm">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1 p-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => startConversationWithUser(user.user_id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-muted-foreground text-sm">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-14rem)]">
          {conversationsLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start typing above to search for users</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => {
                const hasUnread = conversation.user1_id === user?.id 
                  ? conversation.user1_has_unread 
                  : conversation.user2_has_unread;
                
                return (
                  <div
                    key={conversation.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
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
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground truncate">
                          {conversation.other_user_phone || 'No phone'}
                        </span>
                        {hasUnread && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default MessagingContent;