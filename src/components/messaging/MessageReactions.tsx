import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { useMessageReactions } from '@/hooks/messaging/useMessageReactions';

interface MessageReactionsProps {
  messageId: string;
  currentUserId?: string;
  isOwnMessage?: boolean;
}

const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  currentUserId,
  isOwnMessage = false
}) => {
  const { groupedReactions, loading, toggleReaction } = useMessageReactions(messageId, currentUserId);
  const [showPicker, setShowPicker] = useState(false);

  const handleReactionClick = async (emoji: string) => {
    await toggleReaction(emoji);
    setShowPicker(false);
  };

  return (
    <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Display existing reactions */}
      {groupedReactions.length > 0 && (
        <div className="flex items-center gap-1">
          {groupedReactions.map(({ emoji, count, hasReacted }) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              disabled={loading}
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                transition-colors border
                ${hasReacted 
                  ? 'bg-primary/20 border-primary/40 hover:bg-primary/30' 
                  : 'bg-muted border-border hover:bg-muted/80'
                }
              `}
            >
              <span>{emoji}</span>
              <span className="font-medium">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add reaction button */}
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Smile className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align={isOwnMessage ? "end" : "start"}>
          <div className="flex items-center gap-1">
            {AVAILABLE_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                disabled={loading}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
