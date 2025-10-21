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
      {title && (
        <h3 className="font-semibold text-base sm:text-lg leading-tight">
          {title}
        </h3>
      )}
      
      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {isTruncated ? (
          <>
            {text}...
            <span className="text-primary ml-1 font-medium">Read more</span>
          </>
        ) : (
          content
        )}
      </div>

      {location && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
};
