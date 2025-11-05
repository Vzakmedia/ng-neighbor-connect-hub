import React from 'react';
import { Calendar, Users, Building, Home, Globe, MoreVertical } from 'lucide-react';
import { CardHeader } from '@/components/ui/card';
import { OnlineAvatar } from '@/components/OnlineAvatar';
import { PostAuthor } from '@/types/community';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface PostCardHeaderProps {
  author: PostAuthor;
  createdAt: string;
  rsvpEnabled: boolean;
  locationScope?: string;
  targetNeighborhood?: string;
  targetCity?: string;
  targetState?: string;
  onAvatarClick: (userId: string) => void;
}

export const PostCardHeader = ({ 
  author, 
  createdAt, 
  rsvpEnabled,
  locationScope,
  targetNeighborhood,
  targetCity,
  targetState,
  onAvatarClick 
}: PostCardHeaderProps) => {
  const getVisibilityIcon = () => {
    if (locationScope === 'neighborhood') {
      return <Users className="h-3.5 w-3.5 text-muted-foreground" />;
    } else if (locationScope === 'city') {
      return <Building className="h-3.5 w-3.5 text-muted-foreground" />;
    } else if (locationScope === 'state') {
      return <Home className="h-3.5 w-3.5 text-muted-foreground" />;
    } else if (locationScope === 'all') {
      return <Globe className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return <Globe className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getLocation = () => {
    if (locationScope === 'neighborhood' && targetNeighborhood) return targetNeighborhood;
    if (locationScope === 'city' && targetCity) return targetCity;
    if (locationScope === 'state' && targetState) return targetState;
    if (locationScope === 'all') return 'Everyone';
    return author.city || author.state || 'Location';
  };

  return (
    <CardHeader className="p-4">
      <div className="flex items-center gap-3">
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
            className="h-10 w-10"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium truncate">
              {author.full_name || "Anonymous"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground truncate">{getLocation()}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            {getVisibilityIcon()}
            {rsvpEnabled && (
              <>
                <span className="text-muted-foreground">·</span>
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              </>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              View Full Post
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              Report Post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
  );
};
