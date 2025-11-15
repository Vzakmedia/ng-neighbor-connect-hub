import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '@/hooks/useConversations';

interface MobileConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  userId: string;
}

const getInitials = (name: string | null) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const MobileConversationList = ({ conversations, loading, userId }: MobileConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredConversations = conversations.filter(conv => {
    return conv.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Search */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-xl font-semibold text-foreground">Messages</h1>
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto"
            onClick={() => navigate('/search-users')}
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/search-users')}>
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const hasUnread = conversation.user1_id === userId ? conversation.user1_has_unread : conversation.user2_has_unread;
              const lastMessageTime = conversation.last_message_at;

              return (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors active:bg-accent text-left"
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={conversation.other_user_avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(conversation.other_user_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-medium truncate ${hasUnread ? 'text-foreground' : 'text-foreground/90'}`}>
                        {conversation.other_user_name || 'Unknown User'}
                      </h3>
                      {lastMessageTime && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate flex-1 ${hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        Tap to view conversation
                      </p>
                      {hasUnread && (
                        <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] flex-shrink-0">
                          •
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileConversationList;
