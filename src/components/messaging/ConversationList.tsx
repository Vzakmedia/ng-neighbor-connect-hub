import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ConversationItem from './ConversationItem';
import { type Conversation } from '@/hooks/useConversations';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  loading?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = React.memo(({
  conversations,
  activeConversationId,
  currentUserId,
  onConversationSelect,
  loading = false,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // CRITICAL: All hooks must be called before any conditional returns
  // useVirtualizer is already optimized internally - no need to wrap in useMemo
  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 3,
  });

  // Early returns come AFTER all hooks
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
  // Simplified comparison - rely on reference equality for conversations
  return prev.conversations === next.conversations &&
         prev.activeConversationId === next.activeConversationId &&
         prev.loading === next.loading &&
         prev.onConversationSelect === next.onConversationSelect;
});

ConversationList.displayName = 'ConversationList';

export default ConversationList;
