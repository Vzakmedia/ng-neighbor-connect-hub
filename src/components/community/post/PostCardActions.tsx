import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Eye, Calendar } from '@/lib/icons';
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
    <div className="flex items-center justify-between py-2 sm:py-3 px-0.5 sm:px-1">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className={`gap-1 sm:gap-1.5 hover-scale text-xs sm:text-sm min-w-0 px-1.5 sm:px-2 ${post.isLiked ? 'text-red-500' : ''}`}
        >
          <Heart className={`h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 ${post.isLiked ? 'fill-current' : ''}`} />
          <span className="text-xs sm:text-sm">{post.likes_count || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComments();
          }}
          className="gap-1 sm:gap-1.5 hover-scale text-xs sm:text-sm min-w-0 px-1.5 sm:px-2"
        >
          <MessageCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0" />
          <span className="text-xs sm:text-sm">{post.comments_count || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="hover-scale text-xs sm:text-sm min-w-0 px-1.5 sm:px-2"
        >
          <Share2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0" />
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className={`hover-scale px-1.5 sm:px-2 ${post.isSaved ? 'text-primary' : ''}`}
        >
          <Bookmark className={`h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 ${post.isSaved ? 'fill-current' : ''}`} />
        </Button>

        {post.rsvp_enabled && onRSVP && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRSVP();
            }}
            className="hover-scale px-1.5 sm:px-2"
          >
            <Calendar className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0" />
          </Button>
        )}
      </div>
    </div>
  );
};
