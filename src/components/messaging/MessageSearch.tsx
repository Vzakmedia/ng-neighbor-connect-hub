import React from 'react';
import { Search, ChevronUp, ChevronDown } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface MessageSearchProps {
  searchQuery: string;
  currentSearchIndex: number;
  searchResultCount: number;
  onSearchChange: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const MessageSearch: React.FC<MessageSearchProps> = ({
  searchQuery,
  currentSearchIndex,
  searchResultCount,
  onSearchChange,
  onPrevious,
  onNext,
  inputRef
}) => {
  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
          }}
          placeholder="Search messages..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      {searchQuery && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {searchResultCount > 0 ? `${currentSearchIndex + 1}/${searchResultCount}` : 'No results'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            disabled={searchResultCount === 0}
            className="h-7 w-7"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={searchResultCount === 0}
            className="h-7 w-7"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
