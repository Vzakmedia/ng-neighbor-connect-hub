import React from 'react';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { truncateText } from '@/lib/community/postUtils';

interface PostCardContentProps {
  title?: string | null;
  content: string;
  location?: string | null;
  tags: string[];
  onPostClick: () => void;
}

export const PostCardContent = ({ 
  title, 
  content, 
  location, 
  tags,
  onPostClick 
}: PostCardContentProps) => {
  const { text, isTruncated } = truncateText(content, 150);

  return (
    <>
      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {isTruncated ? `${text}...` : content}
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
