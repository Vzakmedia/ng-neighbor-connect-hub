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
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className={`gap-1.5 hover-scale text-sm min-w-0 px-2 ${post.isLiked ? 'text-red-500' : ''}`}
        >
          <Heart className={`h-5 w-5 shrink-0 ${post.isLiked ? 'fill-current' : ''}`} />
          <span>{post.likes_count || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComments();
          }}
          className="gap-1.5 hover-scale text-sm min-w-0 px-2"
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span>{post.comments_count || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="hover-scale text-sm min-w-0 px-2"
        >
          <Share2 className="h-5 w-5 shrink-0" />
        </Button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className={`hover-scale px-2 ${post.isSaved ? 'text-primary' : ''}`}
        >
          <Bookmark className={`h-5 w-5 shrink-0 ${post.isSaved ? 'fill-current' : ''}`} />
        </Button>

        {post.rsvp_enabled && onRSVP && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRSVP();
            }}
            className="hover-scale px-2"
          >
            <Calendar className="h-5 w-5 shrink-0" />
          </Button>
        )}
      </div>
    </div>
  );
};
