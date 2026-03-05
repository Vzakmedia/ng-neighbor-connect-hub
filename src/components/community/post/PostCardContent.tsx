import React from 'react';
import { MapPin } from '@/lib/icons';
import { Badge } from '@/components/ui/badge';
import { truncateText } from '@/lib/community/postUtils';

interface PostCardContentProps {
  title?: string | null;
  content: string;
  location?: string | null;
  tags: string[];
  onPostClick: () => void;
  isFullPost?: boolean;
}

export const PostCardContent = ({
  title,
  content,
  location,
  tags,
  onPostClick,
  isFullPost = false
}: PostCardContentProps) => {
  const { text, isTruncated } = truncateText(content, 150);

  // Decide what text to show: if full post or not truncated, show full content.
  // Otherwise show truncated text.
  const displayContent = isFullPost ? content : (isTruncated ? `${text}...` : content);

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="font-semibold text-base sm:text-lg leading-tight text-foreground">
          {title}
        </h3>
      )}

      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
        {displayContent}
      </div>

      {location && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 w-fit px-2 py-1 rounded-md">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-[10px] font-normal px-2 py-0 h-5">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
