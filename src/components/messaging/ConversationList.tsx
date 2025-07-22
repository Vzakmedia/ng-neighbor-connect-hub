import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Conversation } from './MessagingContent';
import { MessageCircle } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onConversationClick: (conversation: Conversation) => void;
  currentUserId?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  onConversationClick,
  currentUserId
}) => {
  const getUnreadStatus = (conversation: Conversation) => {
    if (!currentUserId) return false;
    
    return conversation.user1_id === currentUserId 
      ? conversation.user1_has_unread 
      : conversation.user2_has_unread;
  };

  const getInitials = (fullName: string | null) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .slice(0, 2)
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  };

  if (conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No conversations yet</h3>
          <p className="text-muted-foreground">
            Start a new conversation to begin messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Conversations</h2>
      </div>
      
      <ScrollArea className="flex-grow">
        <div className="space-y-1 p-2">
          {conversations.map((conversation) => {
            const isActive = activeConversation?.id === conversation.id;
            const hasUnread = getUnreadStatus(conversation);
            
            return (
              <div
                key={conversation.id}
                onClick={() => onConversationClick(conversation)}
                className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.otherUser?.avatar_url || ''} />
                  <AvatarFallback>
                    {getInitials(conversation.otherUser?.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium truncate ${
                      isActive ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      {conversation.otherUser?.full_name || 'Unknown User'}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      {hasUnread && (
                        <Badge 
                          variant="secondary" 
                          className={`h-2 w-2 p-0 rounded-full ${
                            isActive ? 'bg-primary-foreground' : 'bg-primary'
                          }`}
                        />
                      )}
                      <span className={`text-xs ${
                        isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {conversation.lastMessage && (
                    <p className={`text-xs truncate ${
                      isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {conversation.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;