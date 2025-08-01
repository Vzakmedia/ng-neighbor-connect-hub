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
import MessageSelectionToolbar from './MessageSelectionToolbar';

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId?: string;
  onSendMessage: (content: string) => void;
  showReadReceipts: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onBack?: () => void;
  onMessageDeleted?: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  showReadReceipts,
  messagesEndRef,
  onBack,
  onMessageDeleted
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { deleteMessages, deleteConversation, deleteSingleMessage, loading } = useMessageActions();

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
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
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedMessages(new Set([messageId]));
    }
  };

  const handleMessageSelect = (messageId: string, checked: boolean) => {
    const newSelected = new Set(selectedMessages);
    if (checked) {
      newSelected.add(messageId);
    } else {
      newSelected.delete(messageId);
    }
    setSelectedMessages(newSelected);
    
    if (newSelected.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleDeleteSelected = async () => {
    const selectedArray = Array.from(selectedMessages);
    const success = await deleteMessages(selectedArray);
    if (success) {
      setSelectedMessages(new Set());
      setIsSelectionMode(false);
      onMessageDeleted?.();
    }
  };

  const handleDeleteConversation = async () => {
    const success = await deleteConversation(conversation.id);
    if (success) {
      setSelectedMessages(new Set());
      setIsSelectionMode(false);
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
    setSelectedMessages(new Set());
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedMessages(new Set());
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center space-x-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.other_user_avatar || ''} />
          <AvatarFallback>
            {getInitials(conversation.other_user_name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium">
            {conversation.other_user_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {conversation.other_user_phone || 'No phone number'}
          </p>
          <span className="text-xs text-muted-foreground">
            Last seen {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSelectionMode}
            className={isSelectionMode ? 'bg-primary text-primary-foreground' : ''}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                onClick={() => handleDeleteConversation()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
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
                    <p className="text-sm">{message.content}</p>
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
          <div ref={messagesEndRef} />
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

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
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
            disabled={!newMessage.trim()}
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