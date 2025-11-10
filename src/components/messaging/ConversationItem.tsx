import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Badge } from '@/components/ui/badge';
import { type Conversation } from '@/hooks/useConversations';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  hasUnread: boolean;
  onSelect: () => void;
}

const getInitials = (fullName: string | null) => {
  if (!fullName) return 'U';
  return fullName
    .split(' ')
    .slice(0, 2)
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase();
};

const ConversationItem = React.memo<ConversationItemProps>(({ 
  conversation, 
  isActive, 
  hasUnread, 
  onSelect 
}) => {
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

export default ConversationItem;
