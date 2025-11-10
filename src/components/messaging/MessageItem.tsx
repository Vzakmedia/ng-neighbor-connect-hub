import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Clock, AlertCircle, RotateCw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2 } from 'lucide-react';
import AttachmentDisplay from './AttachmentDisplay';
import { MessageReactions } from './MessageReactions';
import { type Message, MessageStatus } from '@/hooks/useDirectMessages';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  isSelected: boolean;
  isFailed: boolean;
  isSearchResult?: boolean;
  isCurrentSearchResult?: boolean;
  showReadReceipts: boolean;
  isSelectionMode: boolean;
  searchQuery?: string;
  currentUserId?: string;
  onSelect: (messageId: string, checked: boolean) => void;
  onLongPress: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
}

const getMessageStatusIcon = (status: MessageStatus, showReadReceipts: boolean, isMobile: boolean) => {
  if (!showReadReceipts) return null;
  
  switch (status) {
    case 'sending':
      return <Clock className={`h-3 w-3 text-muted-foreground ${!isMobile ? 'animate-pulse' : ''}`} />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-primary" />;
    default:
      return null;
  }
};

const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
      : part
  );
};

const MessageItem = React.memo<MessageItemProps>(({
  message,
  isOwn,
  isSelected,
  isFailed,
  isSearchResult,
  isCurrentSearchResult,
  showReadReceipts,
  isSelectionMode,
  searchQuery = '',
  currentUserId,
  onSelect,
  onLongPress,
  onDelete,
  onRetry
}) => {
  const isMobile = window.innerWidth < 768;
  const status: MessageStatus = message.status || 'sent';

  return (
    <div 
      className={`flex items-start gap-3 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${
        isCurrentSearchResult ? 'bg-primary/10 rounded-lg p-2 -m-2' : ''
      }`}
      onTouchStart={(e) => {
        const timeout = setTimeout(() => onLongPress(message.id), 500);
        e.currentTarget.addEventListener('touchend', () => clearTimeout(timeout), { once: true });
      }}
    >
      {isSelectionMode && (
        <div className="pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(message.id, checked as boolean)}
          />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div 
          className={`rounded-2xl px-4 py-2 ${
            isOwn 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-foreground'
          } ${isFailed ? 'opacity-50' : ''} ${
            isSearchResult && !isCurrentSearchResult ? 'ring-1 ring-primary/50' : ''
          }`}
        >
          {message.content && (
            <p className="text-sm break-words whitespace-pre-wrap">
              {highlightText(message.content, searchQuery)}
            </p>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2">
              <AttachmentDisplay 
                attachments={message.attachments} 
                variant={isOwn ? 'sent' : 'received'}
              />
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
          {isOwn && getMessageStatusIcon(status, showReadReceipts, isMobile)}
          {isFailed && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(message.id)}
              className="h-6 px-2 text-xs"
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          
          {!isSelectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-destructive">
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <MessageReactions 
          messageId={message.id} 
          currentUserId={currentUserId}
          isOwnMessage={isOwn}
        />
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.message.id === next.message.id &&
         prev.isSelected === next.isSelected &&
         prev.isSearchResult === next.isSearchResult &&
         prev.isCurrentSearchResult === next.isCurrentSearchResult &&
         prev.message.status === next.message.status &&
         prev.message.content === next.message.content &&
         prev.searchQuery === next.searchQuery;
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
