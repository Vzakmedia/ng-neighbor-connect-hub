import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from '@/lib/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Send, Check, CheckCircle as CheckCheck, Clock, AlertCircle, RotateCw, MoreVertical, Trash2 } from '@/lib/icons';
import { formatDistanceToNow } from 'date-fns';
import { type Conversation } from '@/hooks/useConversations';
import { type Message, MessageStatus } from '@/hooks/useDirectMessages';
import { ConnectionStatusBanner } from './ConnectionStatusBanner';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useFileUpload, type Attachment } from '@/hooks/useFileUpload';
import MessageSelectionToolbar from './MessageSelectionToolbar';
import AttachmentButton from './AttachmentButton';
import EmojiPickerButton from './EmojiPickerButton';
import AttachmentDisplay from './AttachmentDisplay';
import { useTypingIndicator } from '@/hooks/messaging/useTypingIndicator';
import { MessageReactions } from './MessageReactions';
import MessageThreadHeader from './MessageThreadHeader';
import MessageSearch from './MessageSearch';

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId?: string;
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  showReadReceipts: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onBack?: () => void;
  onMessageDeleted?: () => void;
  isSelectionMode?: boolean;
  selectedMessages?: Set<string>;
  onSelectedMessagesChange?: (messages: Set<string>) => void;
  onRetryMessage?: (messageId: string) => void;
  onLoadOlder?: () => void;
  loadingOlder?: boolean;
  hasMoreMessages?: boolean;
  onMarkAsRead?: (messageId: string) => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  showReadReceipts,
  messagesEndRef,
  onBack,
  onMessageDeleted,
  isSelectionMode = false,
  selectedMessages = new Set(),
  onSelectedMessagesChange,
  onRetryMessage,
  onLoadOlder,
  loadingOlder = false,
  hasMoreMessages = true,
  onMarkAsRead
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const messageVisibilityMap = useRef<Map<string, boolean>>(new Map());
  const readReceiptBatchRef = useRef<Set<string>>(new Set());
  const readReceiptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sharedObserverRef = useRef<IntersectionObserver | null>(null);
  const isMobile = window.innerWidth < 768;
  
  const { deleteMessages, deleteConversation, deleteSingleMessage, loading } = useMessageActions();
  const { uploading, uploadMultipleFiles } = useFileUpload(currentUserId || '');
  const { isOtherTyping, notifyTypingStart, notifyTypingStop } = useTypingIndicator(
    conversation.id,
    currentUserId,
    conversation.other_user_id
  );

  const handleSendMessage = async () => {
    if (newMessage.trim() || pendingAttachments.length > 0) {
      await onSendMessage(newMessage, pendingAttachments);
      notifyTypingStop();
      setNewMessage('');
      setPendingAttachments([]);
    }
  };

  const handleFileSelect = async (files: File[]) => {
    const attachments = await uploadMultipleFiles(files);
    setPendingAttachments(prev => [...prev, ...attachments]);
  };

  const removePendingAttachment = (attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    
    const query = searchQuery.toLowerCase();
    return messages.filter(msg => 
      msg.content?.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  // Get search result indices
  const searchResultIndices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return messages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => msg.content?.toLowerCase().includes(query))
      .map(({ idx }) => idx);
  }, [messages, searchQuery]);

  const searchResultCount = searchResultIndices.length;

  // Navigate to specific search result
  const scrollToSearchResult = useCallback((index: number) => {
    if (searchResultIndices.length === 0) return;
    
    const messageIndex = searchResultIndices[index];
    const message = messages[messageIndex];
    
    if (message && parentRef.current) {
      const messageEl = parentRef.current.querySelector(`[data-message-id="${message.id}"]`);
      messageEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchResultIndices, messages]);

  const handleNextResult = useCallback(() => {
    if (searchResultCount === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResultCount;
    setCurrentSearchIndex(nextIndex);
    scrollToSearchResult(nextIndex);
  }, [currentSearchIndex, searchResultCount, scrollToSearchResult]);

  const handlePreviousResult = useCallback(() => {
    if (searchResultCount === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResultCount - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToSearchResult(prevIndex);
  }, [currentSearchIndex, searchResultCount, scrollToSearchResult]);

  const toggleSearch = useCallback(() => {
    setShowSearch(prev => !prev);
    if (!showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setCurrentSearchIndex(0);
    }
  }, [showSearch]);

  // Highlight matching text in message
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  }, []);

  useEffect(() => {
    if (textareaRef.current && !showSearch) {
      textareaRef.current.focus();
    }
  }, [conversation.id, showSearch]);

  // Reset search when conversation changes
  useEffect(() => {
    setSearchQuery('');
    setShowSearch(false);
    setCurrentSearchIndex(0);
  }, [conversation.id]);

  const getInitials = (fullName: string | null) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .slice(0, 2)
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  };

  const getMessageStatusIcon = (message: Message) => {
    const isOwn = message.sender_id === currentUserId;
    if (!isOwn || !showReadReceipts) return null;
    
    const status: MessageStatus = message.status || 'sent';
    
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

  const handleLongPress = (messageId: string) => {
    if (!isSelectionMode && onSelectedMessagesChange) {
      onSelectedMessagesChange(new Set([messageId]));
    }
  };

  const handleMessageSelect = (messageId: string, checked: boolean) => {
    if (!onSelectedMessagesChange) return;
    
    const newSelected = new Set(selectedMessages);
    if (checked) {
      newSelected.add(messageId);
    } else {
      newSelected.delete(messageId);
    }
    onSelectedMessagesChange(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (!onSelectedMessagesChange) return;
    
    const selectedArray = Array.from(selectedMessages);
    const success = await deleteMessages(selectedArray);
    if (success) {
      onSelectedMessagesChange(new Set());
      onMessageDeleted?.();
    }
  };

  const handleDeleteConversation = async () => {
    if (!onSelectedMessagesChange) return;
    
    const success = await deleteConversation(conversation.id);
    if (success) {
      onSelectedMessagesChange(new Set());
      onBack?.();
    }
  };

  const handleDeleteSingleMessage = async (messageId: string) => {
    const success = await deleteSingleMessage(messageId);
    if (success) {
      onMessageDeleted?.();
    }
  };

  const handleClearSelection = () => {
    if (onSelectedMessagesChange) {
      onSelectedMessagesChange(new Set());
    }
  };

  // Virtual scrolling setup - optimized for mobile
  const displayMessages = searchQuery.trim() ? filteredMessages : messages;
  const virtualizer = useVirtualizer({
    count: displayMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: isMobile ? 2 : 5, // Reduce overscan on mobile
  });

  // Batch process read receipts
  const processBatchedReadReceipts = useCallback(() => {
    if (!onMarkAsRead || !currentUserId) return;
    
    const batch = Array.from(readReceiptBatchRef.current);
    batch.forEach(messageId => {
      const message = messages.find(m => m.id === messageId);
      if (message && message.recipient_id === currentUserId && message.status !== 'read') {
        onMarkAsRead(messageId);
      }
    });
    
    readReceiptBatchRef.current.clear();
  }, [messages, currentUserId, onMarkAsRead]);

  // Single shared IntersectionObserver for all messages
  useEffect(() => {
    if (!onMarkAsRead) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const messageId = entry.target.getAttribute('data-message-id');
          if (!messageId) return;
          
          const wasVisible = messageVisibilityMap.current.get(messageId);
          const isVisible = entry.isIntersecting;
          
          if (!wasVisible && isVisible) {
            messageVisibilityMap.current.set(messageId, true);
            readReceiptBatchRef.current.add(messageId);
            
            // Batch update after 1 second
            if (readReceiptTimerRef.current) clearTimeout(readReceiptTimerRef.current);
            readReceiptTimerRef.current = setTimeout(() => {
              processBatchedReadReceipts();
            }, 1000);
          } else if (wasVisible && !isVisible) {
            messageVisibilityMap.current.set(messageId, false);
          }
        });
      },
      { threshold: 0.5, rootMargin: '50px' }
    );
    
    sharedObserverRef.current = observer;
    
    return () => {
      observer.disconnect();
      if (readReceiptTimerRef.current) clearTimeout(readReceiptTimerRef.current);
    };
  }, [onMarkAsRead, processBatchedReadReceipts]);

  // Intersection Observer for loading older messages
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !onLoadOlder || !hasMoreMessages) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingOlder) {
          onLoadOlder();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreTriggerRef.current);
    
    return () => observer.disconnect();
  }, [onLoadOlder, loadingOlder, hasMoreMessages]);

  // Auto-scroll to bottom - instant on mobile for better performance
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: isMobile ? 'auto' : 'smooth' 
      });
    }, 100);
  }, [messages.length]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden w-full">
      <MessageThreadHeader 
        conversation={conversation}
        showSearch={showSearch}
        onBack={onBack}
        onToggleSearch={toggleSearch}
      />
      
      {showSearch && (
        <div className="px-4 md:px-6">
          <MessageSearch 
            searchQuery={searchQuery}
            currentSearchIndex={currentSearchIndex}
            searchResultCount={searchResultCount}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setCurrentSearchIndex(0);
            }}
            onPrevious={handlePreviousResult}
            onNext={handleNextResult}
            inputRef={searchInputRef}
          />
        </div>
      )}
      
      {/* Messages - virtualized scrolling */}
      <div ref={parentRef} className="flex-1 overflow-y-auto px-3 md:px-6">
        <div 
          className="py-4 pb-4"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {/* Load more trigger */}
          {hasMoreMessages && (
            <div ref={loadMoreTriggerRef} className="py-4 flex justify-center">
              {loadingOlder && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading older messages...</span>
                </div>
              )}
            </div>
          )}
          
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const message = displayMessages[virtualRow.index];
            const isSearchResult = searchQuery.trim() && searchResultIndices.includes(messages.indexOf(message));
            const isCurrentSearchResult = isSearchResult && searchResultIndices[currentSearchIndex] === messages.indexOf(message);
            const isOwn = message.sender_id === currentUserId;
            const isSelected = selectedMessages.has(message.id);
            const isFailed = message.status === 'failed';
            
            return (
              <div 
                key={message.id}
                data-message-id={message.id}
                ref={(el) => {
                  if (!el || !sharedObserverRef.current) return;
                  sharedObserverRef.current.observe(el);
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`,
                }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group pb-4`}
                onDoubleClick={() => handleLongPress(message.id)}
              >
                {isSelectionMode && (
                  <div className={`flex items-center mr-2 ${isOwn ? 'order-3' : 'order-0'}`}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleMessageSelect(message.id, checked as boolean)}
                    />
                  </div>
                )}
                
                <div className={`max-w-[75%] md:max-w-[65%] ${isOwn ? 'order-2' : 'order-1'} relative`}>
                  <div 
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      isOwn 
                        ? isFailed
                          ? 'bg-destructive/10 text-foreground border border-destructive/30'
                          : 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    } ${isSelected ? 'ring-2 ring-primary' : ''} ${isCurrentSearchResult ? 'ring-2 ring-accent' : ''}`}
                  >
                    {message.content && (
                      <p className="text-sm md:text-base leading-relaxed break-words">
                        {searchQuery.trim() ? highlightText(message.content, searchQuery) : message.content}
                      </p>
                    )}
                    {message.attachments && message.attachments.length > 0 && (
                      <AttachmentDisplay 
                        attachments={message.attachments}
                        onPreview={async (attachment) => {
                          // Handle attachment preview in native browser
                          const { openUrl } = await import('@/utils/nativeBrowser');
                          await openUrl(attachment.url, '_blank');
                        }}
                      />
                    )}
                  </div>
                  
                  <div className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-1 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                      {getMessageStatusIcon(message)}
                      {isFailed && isOwn && onRetryMessage && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 ml-1"
                          onClick={() => onRetryMessage(message.id)}
                        >
                          <RotateCw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Message Reactions */}
                    <MessageReactions 
                      messageId={message.id} 
                      currentUserId={currentUserId}
                      isOwnMessage={isOwn}
                    />
                  </div>

                  {/* Single message delete option for own messages */}
                  {!isSelectionMode && isOwn && !isFailed && (
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-background border">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSingleMessage(message.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                
                {!isOwn && (
                  <div className={`mr-2 md:mr-3 ${isSelectionMode ? 'order-0' : 'order-0'}`}>
                    <OnlineAvatar
                      userId={conversation.other_user_id}
                      src={conversation.other_user_avatar || ''}
                      fallback={getInitials(conversation.other_user_name)}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
          {/* Auto-scroll target */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Selection Toolbar */}
      <MessageSelectionToolbar
        selectedCount={selectedMessages.size}
        onDeleteSelected={handleDeleteSelected}
        onDeleteConversation={handleDeleteConversation}
        onClearSelection={handleClearSelection}
        loading={loading}
      />

      {/* Fixed/Pinned Message input - WhatsApp style sticky bottom */}
      <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 px-4 md:px-6 py-3 md:py-4 border-t bg-background shadow-lg">
        {/* Pending attachments preview */}
        {pendingAttachments.length > 0 && (
          <div className="mb-2 md:mb-4 p-2 md:p-3 bg-muted/30 rounded-lg">
            <p className="text-xs md:text-sm font-medium mb-2">Attachments to send:</p>
            <div className="space-y-2">
              {pendingAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                  <span className="text-xs md:text-sm flex-1 truncate">{attachment.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingAttachment(attachment.id)}
                    className="h-6 w-6 p-0 text-destructive"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {isOtherTyping && (
          <div className="mb-1 text-xs text-muted-foreground animate-pulse">
            {(conversation.other_user_name || 'User')} is typing…
          </div>
        )}
        <div className="flex items-end gap-2 md:gap-3">
          <AttachmentButton 
            onFileSelect={handleFileSelect}
            uploading={uploading}
          />
          <EmojiPickerButton 
            onEmojiSelect={handleEmojiSelect}
            disabled={uploading || loading}
          />
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              notifyTypingStart();
            }}
            onBlur={notifyTypingStop}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 min-h-[44px] md:min-h-[48px] max-h-[120px] resize-none text-sm md:text-base rounded-2xl"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && pendingAttachments.length === 0}
            size="icon"
            className="bg-gradient-primary hover:opacity-90 transition-opacity h-11 w-11 md:h-12 md:w-12 rounded-full"
          >
            <Send className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Step 8: Optimize MessageThread re-renders with React.memo
export default memo(MessageThread, (prev, next) => {
  return (
    prev.conversation.id === next.conversation.id &&
    prev.messages.length === next.messages.length &&
    prev.currentUserId === next.currentUserId &&
    prev.isSelectionMode === next.isSelectionMode
  );
});