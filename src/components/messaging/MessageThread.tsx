import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Send, Check, CheckCheck, ArrowLeft, MoreVertical, Trash2, CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { type Conversation } from '@/hooks/useConversations';
import { type Message } from '@/hooks/useDirectMessages';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useFileUpload, type Attachment } from '@/hooks/useFileUpload';
import MessageSelectionToolbar from './MessageSelectionToolbar';
import AttachmentButton from './AttachmentButton';
import AttachmentDisplay from './AttachmentDisplay';

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
  onSelectedMessagesChange
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { deleteMessages, deleteConversation, deleteSingleMessage, loading } = useMessageActions();
  const { uploading, uploadMultipleFiles } = useFileUpload(currentUserId || '');

  const handleSendMessage = async () => {
    if (newMessage.trim() || pendingAttachments.length > 0) {
      await onSendMessage(newMessage, pendingAttachments);
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
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

  const getMessageStatusIcon = (status: string, isOwn: boolean) => {
    if (!isOwn || !showReadReceipts) return null;
    
    switch (status) {
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

  return (
    <div className="h-full flex flex-col relative">
      {/* Messages - with bottom padding to account for sticky input */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4 pb-32">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            const isSelected = selectedMessages.has(message.id);
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
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
                
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'} relative`}>
                  <div 
                    className={`p-3 rounded-lg ${
                      isOwn 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  >
                    {message.content && <p className="text-sm">{message.content}</p>}
                    {message.attachments && message.attachments.length > 0 && (
                      <AttachmentDisplay 
                        attachments={message.attachments}
                        onPreview={(attachment) => {
                          // Handle attachment preview
                          window.open(attachment.url, '_blank');
                        }}
                      />
                    )}
                  </div>
                  
                  <div className={`flex items-center mt-1 space-x-1 ${
                    isOwn ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {getMessageStatusIcon(message.status, isOwn)}
                  </div>

                  {/* Single message delete option for own messages */}
                  {!isSelectionMode && isOwn && (
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
                  <div className={`mr-2 ${isSelectionMode ? 'order-0' : 'order-0'}`}>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={conversation.other_user_avatar || ''} />
                      <AvatarFallback className="text-xs">
                        {getInitials(conversation.other_user_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            );
          })}
          {/* Auto-scroll target */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </ScrollArea>

      {/* Selection Toolbar */}
      <MessageSelectionToolbar
        selectedCount={selectedMessages.size}
        onDeleteSelected={handleDeleteSelected}
        onDeleteConversation={handleDeleteConversation}
        onClearSelection={handleClearSelection}
        loading={loading}
      />

      {/* Fixed/Pinned Message input - WhatsApp style sticky bottom */}
      <div className="sticky bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 shadow-lg">
        {/* Pending attachments preview */}
        {pendingAttachments.length > 0 && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Attachments to send:</p>
            <div className="space-y-2">
              {pendingAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                  <span className="text-sm flex-1 truncate">{attachment.name}</span>
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
        
        <div className="flex space-x-2">
          <AttachmentButton 
            onFileSelect={handleFileSelect}
            uploading={uploading}
          />
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && pendingAttachments.length === 0}
            size="icon"
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;