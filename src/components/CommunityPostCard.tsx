import React, { useState, memo } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Eye, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OnlineAvatar } from "@/components/OnlineAvatar";
import CommentSection from "@/components/CommentSection";
import { formatDistanceToNow } from "date-fns";

interface Event {
  id: string;
  user_id: string;
  content: string;
  title?: string;
  image_urls?: string[];
  tags?: string[];
  location?: string;
  rsvp_enabled?: boolean;
  created_at: string;
  author?: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
  };
  likes_count?: number;
  comments_count?: number;
  saves_count?: number;
  views_count?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

interface CommunityPostCardProps {
  event: Event;
  onLike: (eventId: string) => void;
  onSave: (eventId: string) => void;
  onShare: (event: Event) => void;
  onRSVP: (event: Event) => void;
  onViewEvent: (event: Event) => void;
  onAvatarClick: (userId: string) => void;
  onImageClick: (event: Event, imageIndex?: number) => void;
  onPostClick: (event: Event) => void;
  showComments: boolean;
  onToggleComments: () => void;
}

// Memoize component to prevent unnecessary re-renders
const CommunityPostCardComponent = ({
  event,
  onLike,
  onSave,
  onShare,
  onRSVP,
  onViewEvent,
  onAvatarClick,
  onImageClick,
  onPostClick,
  showComments,
  onToggleComments
}: CommunityPostCardProps) => {
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  return (
    <Card 
      className="w-full animate-fade-in hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onPostClick(event)}
    >
      <CardHeader className="pb-2 px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onAvatarClick(event.author?.user_id || event.user_id);
            }}
          >
            <OnlineAvatar
              userId={event.author?.user_id || event.user_id}
              src={event.author?.avatar_url}
              fallback={event.author?.full_name?.[0] || "U"}
              className="h-8 w-8 sm:h-10 sm:w-10"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {event.author?.full_name || "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </p>
          </div>
          {event.rsvp_enabled && (
            <Badge variant="secondary" className="gap-1 text-xs shrink-0">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">Event</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
        {event.title && (
          <h3 className="font-semibold text-base sm:text-lg leading-tight">
            {event.title}
          </h3>
        )}
        
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {event.content.length > 150 ? (
            <>
              {event.content.substring(0, 150)}...
              <span className="text-primary ml-1 font-medium">Read more</span>
            </>
          ) : (
            event.content
          )}
        </div>

        {event.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {event.image_urls && event.image_urls.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {event.image_urls.slice(0, 4).map((url, index) => (
              !imageError[index] && (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Post image ${index + 1}`}
                    loading="lazy"
                    className="w-full h-40 sm:h-48 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    onError={() => handleImageError(index)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageClick(event, index);
                    }}
                  />
                  {event.image_urls!.length > 4 && index === 3 && (
                    <div 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageClick(event, index);
                      }}
                    >
                      <span className="text-white font-medium text-sm sm:text-base">
                        +{event.image_urls!.length - 4} more
                      </span>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 sm:gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onLike(event.id);
              }}
              className={`gap-1 hover-scale text-xs sm:text-sm min-w-0 px-2 ${event.isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-4 w-4 shrink-0 ${event.isLiked ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{event.likes_count || 0}</span>
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
              <span className="hidden sm:inline">{event.comments_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onShare(event);
              }}
              className="gap-1 hover-scale text-xs sm:text-sm min-w-0 px-2"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <Eye className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{event.views_count || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSave(event.id);
              }}
              className={`hover-scale px-2 ${event.isSaved ? 'text-primary' : ''}`}
            >
              <Bookmark className={`h-4 w-4 shrink-0 ${event.isSaved ? 'fill-current' : ''}`} />
            </Button>

            {event.rsvp_enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRSVP(event);
                }}
                className="hover-scale text-xs sm:text-sm px-2 sm:px-3 shrink-0"
              >
                <span className="hidden sm:inline">RSVP</span>
                <Calendar className="h-4 w-4 sm:hidden" />
              </Button>
            )}
          </div>
        </div>

        {showComments && (
          <div className="pt-3 border-t animate-fade-in">
            <CommentSection postId={event.id} commentCount={event.comments_count || 0} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Export memoized version for better performance
export const CommunityPostCard = memo(CommunityPostCardComponent);

export default CommunityPostCard;