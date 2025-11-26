import { Heart, MessageCircle, Play, Bookmark } from "@/lib/icons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PostCardData } from "@/types/community";
import { Button } from "@/components/ui/button";

interface TrendingPostSlideCardProps {
  post: PostCardData;
  onPostClick: () => void;
  onSave: () => void;
}

export const TrendingPostSlideCard = ({
  post,
  onPostClick,
  onSave,
}: TrendingPostSlideCardProps) => {
  // Determine background image
  const backgroundImage = post.video_thumbnail_url
    ? post.video_thumbnail_url
    : post.image_urls?.[0];

  const hasVideo = !!post.video_url;

  return (
    <div
      onClick={onPostClick}
      className="relative w-[180px] h-[240px] rounded-lg overflow-hidden cursor-pointer group flex-shrink-0"
    >
      {/* Background Image or Gradient */}
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/20" />
      )}

      {/* Gradient Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

      {/* Video Play Icon */}
      {hasVideo && backgroundImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
            <Play className="h-8 w-8 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Top Section: Avatar and Save Button */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
        <Avatar className="h-8 w-8 border-2 border-white/80">
          <AvatarImage src={post.author.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {post.author.full_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
        >
          <Bookmark
            className={`h-4 w-4 ${
              post.is_saved ? "fill-white text-white" : "text-white"
            }`}
          />
        </Button>
      </div>

      {/* Bottom Section: Content and Stats */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
        {/* Post Content Preview */}
        <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
          {post.content}
        </p>

        {/* Author Name */}
        <p className="text-white/80 text-xs">@{post.author.full_name}</p>

        {/* Engagement Stats */}
        <div className="flex items-center gap-3 text-white/70 text-xs">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{post.like_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span>{post.comment_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
