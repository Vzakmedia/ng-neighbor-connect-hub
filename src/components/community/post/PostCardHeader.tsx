import React from 'react';
import { Calendar } from 'lucide-react';
import { CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnlineAvatar } from '@/components/OnlineAvatar';
import { PostAuthor } from '@/types/community';
import { formatDistanceToNow } from 'date-fns';

interface PostCardHeaderProps {
  author: PostAuthor;
  createdAt: string;
  rsvpEnabled: boolean;
  onAvatarClick: (userId: string) => void;
}

export const PostCardHeader = ({ 
  author, 
  createdAt, 
  rsvpEnabled, 
  onAvatarClick 
}: PostCardHeaderProps) => {
  return (
    <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div 
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onAvatarClick(author.user_id);
          }}
        >
          <OnlineAvatar
            userId={author.user_id}
            src={author.avatar_url}
            fallback={author.full_name?.[0] || "U"}
            className="h-8 w-8 sm:h-10 sm:w-10"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {author.full_name || "Anonymous"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
        {rsvpEnabled && (
          <Badge variant="secondary" className="gap-1 text-xs shrink-0">
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">Event</span>
          </Badge>
        )}
      </div>
    </CardHeader>
  );
};
