import { useState } from "react";
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
  showComments: boolean;
  onToggleComments: () => void;
}

export const CommunityPostCard = ({
  event,
  onLike,
  onSave,
  onShare,
  onRSVP,
  onViewEvent,
  onAvatarClick,
  showComments,
  onToggleComments
}: CommunityPostCardProps) => {
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  return (
    <Card className="w-full animate-fade-in hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div 
            className="cursor-pointer"
            onClick={() => onAvatarClick(event.author?.user_id || event.user_id)}
          >
            <OnlineAvatar
              userId={event.author?.user_id || event.user_id}
              src={event.author?.avatar_url}
              fallback={event.author?.full_name?.[0] || "U"}
              className="h-10 w-10"
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
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              Event
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {event.title && (
          <h3 className="font-semibold text-lg leading-tight">{event.title}</h3>
        )}
        
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {event.content}
        </p>

        {event.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}

        {event.image_urls && event.image_urls.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {event.image_urls.slice(0, 4).map((url, index) => (
              !imageError[index] && (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    onError={() => handleImageError(index)}
                    onClick={() => onViewEvent(event)}
                  />
                  {event.image_urls.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <span className="text-white font-medium">
                        +{event.image_urls.length - 4} more
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(event.id)}
              className={`gap-1 hover-scale ${event.isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-4 w-4 ${event.isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{event.likes_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleComments}
              className="gap-1 hover-scale"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{event.comments_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(event)}
              className="gap-1 hover-scale"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
            >
              <Eye className="h-4 w-4" />
              <span className="text-xs">{event.views_count || 0}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSave(event.id)}
              className={`hover-scale ${event.isSaved ? 'text-primary' : ''}`}
            >
              <Bookmark className={`h-4 w-4 ${event.isSaved ? 'fill-current' : ''}`} />
            </Button>

            {event.rsvp_enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRSVP(event)}
                className="hover-scale"
              >
                RSVP
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewEvent(event)}
              className="hover-scale"
            >
              View
            </Button>
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