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
    <>
      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {displayContent}
      </div>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs font-normal">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
};
