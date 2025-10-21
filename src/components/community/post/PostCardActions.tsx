import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostCardData } from '@/types/community';

interface PostCardActionsProps {
  post: PostCardData;
  showComments: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onRSVP?: () => void;
  onToggleComments: () => void;
}

export const PostCardActions = ({ 
  post, 
  showComments, 
  onLike, 
  onSave, 
  onShare, 
  onRSVP, 
  onToggleComments 
}: PostCardActionsProps) => {
  return (
    <div className="flex items-center justify-between pt-2 border-t">
      <div className="flex items-center gap-1 sm:gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className={`gap-1 hover-scale text-xs sm:text-sm min-w-0 px-2 ${post.isLiked ? 'text-red-500' : ''}`}
        >
          <Heart className={`h-4 w-4 shrink-0 ${post.isLiked ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">{post.likes_count || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComments();
          }}
          className="gap-1 hover-scale text-xs sm:text-sm min-w-0 px-2"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{post.comments_count || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="gap-1 hover-scale text-xs sm:text-sm min-w-0 px-2"
        >
          <Share2 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
          <Eye className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{post.views_count || 0}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className={`hover-scale px-2 ${post.isSaved ? 'text-primary' : ''}`}
        >
          <Bookmark className={`h-4 w-4 shrink-0 ${post.isSaved ? 'fill-current' : ''}`} />
        </Button>

        {post.rsvp_enabled && onRSVP && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRSVP();
            }}
            className="hover-scale text-xs sm:text-sm px-2 sm:px-3 shrink-0"
          >
            <span className="hidden sm:inline">RSVP</span>
            <Calendar className="h-4 w-4 sm:hidden" />
          </Button>
        )}
      </div>
    </div>
  );
};
