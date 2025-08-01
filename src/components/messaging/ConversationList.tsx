import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Conversation } from '@/hooks/useConversations';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  loading?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  currentUserId,
  onConversationSelect,
  loading = false,
}) => {
  const getInitials = (fullName: string | null) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .slice(0, 2)
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  };

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
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => {
          const isActive = activeConversationId === conversation.id;
          const hasUnread = currentUserId 
            ? (conversation.user1_id === currentUserId 
                ? conversation.user1_has_unread 
                : conversation.user2_has_unread)
            : false;

          return (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.other_user_avatar || ''} />
                  <AvatarFallback>
                    {getInitials(conversation.other_user_name)}
                  </AvatarFallback>
                </Avatar>
                
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
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ConversationList;