import React from 'react';
import { ArrowLeft, Search, X } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import OnlineAvatar from '@/components/OnlineAvatar';
import { type Conversation } from '@/hooks/useConversations';

interface MessageThreadHeaderProps {
  conversation: Conversation;
  showSearch: boolean;
  onBack?: () => void;
  onToggleSearch: () => void;
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

const MessageThreadHeader: React.FC<MessageThreadHeaderProps> = ({
  conversation,
  showSearch,
  onBack,
  onToggleSearch
}) => {
  return (
    <div className="px-4 md:px-6 py-3 border-b bg-background">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <OnlineAvatar
          userId={conversation.other_user_id}
          src={conversation.other_user_avatar || ''}
          fallback={getInitials(conversation.other_user_name)}
          size="md"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-base">{conversation.other_user_name || 'Unknown User'}</h3>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleSearch}
          className="h-8 w-8"
        >
          {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default MessageThreadHeader;
