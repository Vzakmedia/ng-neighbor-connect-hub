import React, { useMemo, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Badge } from '@/components/ui/badge';
import { type Conversation } from '@/hooks/useConversations';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  loading?: boolean;
}

const ConversationItem = React.memo<{
  conversation: Conversation;
  isActive: boolean;
  hasUnread: boolean;
  onSelect: () => void;
}>(({ conversation, isActive, hasUnread, onSelect }) => {
  const getInitials = (fullName: string | null) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .slice(0, 2)
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-primary/10 border border-primary/20' 
          : 'hover:bg-muted'
      }`}
    >
      <div className="flex items-center space-x-3">
        <OnlineAvatar
          userId={conversation.other_user_id}
          src={conversation.other_user_avatar || ''}
          fallback={getInitials(conversation.other_user_name)}
          size="lg"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`font-medium truncate ${
              hasUnread ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {conversation.other_user_name}
            </p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            {hasUnread && (
              <Badge variant="secondary" className="text-xs">
                New
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.conversation.id === next.conversation.id &&
         prev.isActive === next.isActive &&
         prev.hasUnread === next.hasUnread &&
         prev.conversation.last_message_at === next.conversation.last_message_at;
});

ConversationItem.displayName = 'ConversationItem';

const ConversationList: React.FC<ConversationListProps> = React.memo(({
  conversations,
  activeConversationId,
  currentUserId,
  onConversationSelect,
  loading = false,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling for better performance with many conversations
  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 3,
  });

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading conversations...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-sm mt-2">Start a new conversation to get started</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div 
        className="p-2"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const conversation = conversations[virtualRow.index];
          const isActive = activeConversationId === conversation.id;
          const hasUnread = currentUserId 
            ? (conversation.user1_id === currentUserId 
                ? conversation.user1_has_unread 
                : conversation.user2_has_unread)
            : false;

          return (
            <div
              key={conversation.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                padding: '4px 0',
              }}
            >
              <ConversationItem
                conversation={conversation}
                isActive={isActive}
                hasUnread={hasUnread}
                onSelect={() => onConversationSelect(conversation)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.conversations.length === next.conversations.length &&
         prev.activeConversationId === next.activeConversationId &&
         prev.loading === next.loading &&
         prev.conversations.every((conv, i) => 
           conv.id === next.conversations[i]?.id &&
           conv.last_message_at === next.conversations[i]?.last_message_at
         );
});

ConversationList.displayName = 'ConversationList';

export default ConversationList;
