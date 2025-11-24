import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Bookmark, Heart } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/types/recommendations";
import { useNavigate } from "react-router-dom";
import { useToggleSave, useToggleLike } from "@/hooks/useRecommendations.tsx";

interface Props {
  recommendation: Recommendation;
  variant?: 'grid' | 'list' | 'featured';
  showActions?: boolean;
}

export function RecommendationCard({ recommendation, variant = 'grid', showActions = true }: Props) {
  const navigate = useNavigate();
  const toggleSave = useToggleSave();
  const toggleLike = useToggleLike();

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave.mutate({ 
      recommendationId: recommendation.id, 
      isSaved: recommendation.is_saved || false 
    });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike.mutate({ 
      recommendationId: recommendation.id, 
      isLiked: recommendation.is_liked || false 
    });
  };

  const mainImage = recommendation.image_urls[0] || '/placeholder.svg';

  if (variant === 'list') {
    return (
      <Card 
        className="flex gap-4 p-4 cursor-pointer hover:shadow-md transition-all"
        onClick={() => navigate(`/recommendations/${recommendation.id}`)}
      >
        <img 
          src={mainImage}
          alt={recommendation.title}
          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground line-clamp-1">{recommendation.title}</h3>
            {showActions && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className={cn(recommendation.is_saved && "text-primary")}
                >
                  <Bookmark className={cn("h-4 w-4", recommendation.is_saved && "fill-current")} />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{recommendation.average_rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({recommendation.total_reviews})</span>
            </div>
            {recommendation.price_range && (
              <Badge variant="secondary" className="text-xs">{recommendation.price_range}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{recommendation.city}, {recommendation.state}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
      onClick={() => navigate(`/recommendations/${recommendation.id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={mainImage}
          alt={recommendation.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {showActions && (
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/90 hover:bg-background"
              onClick={handleSave}
            >
              <Bookmark className={cn("h-4 w-4", recommendation.is_saved && "fill-current text-primary")} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/90 hover:bg-background"
              onClick={handleLike}
            >
              <Heart className={cn("h-4 w-4", recommendation.is_liked && "fill-current text-red-500")} />
            </Button>
          </div>
        )}
        {recommendation.is_verified && (
          <Badge className="absolute top-2 left-2 bg-primary">
            Verified
          </Badge>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{recommendation.title}</h3>
          {recommendation.price_range && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">{recommendation.price_range}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {recommendation.description}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{recommendation.average_rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({recommendation.total_reviews})</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{recommendation.city}, {recommendation.state}</span>
        </div>
        {recommendation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recommendation.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
