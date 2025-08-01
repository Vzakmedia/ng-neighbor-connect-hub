import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  MessageSquare, 
  X, 
  MoreVertical,
  Archive,
  Forward
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageSelectionToolbarProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onDeleteConversation: () => void;
  onClearSelection: () => void;
  loading?: boolean;
}

const MessageSelectionToolbar: React.FC<MessageSelectionToolbarProps> = ({
  selectedCount,
  onDeleteSelected,
  onDeleteConversation,
  onClearSelection,
  loading = false
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background border rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 z-50">
      <span className="text-sm font-medium">
        {selectedCount} message{selectedCount > 1 ? 's' : ''} selected
      </span>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteSelected}
          disabled={loading}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete Messages
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={loading}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={onDeleteConversation}
              className="text-destructive focus:text-destructive"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Delete Entire Conversation
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Archive className="h-4 w-4 mr-2" />
              Archive Messages (Coming Soon)
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Forward className="h-4 w-4 mr-2" />
              Forward Messages (Coming Soon)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageSelectionToolbar;