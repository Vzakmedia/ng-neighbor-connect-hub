import { useNavigate } from "react-router-dom";
import { StarIcon, BookmarkIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import type { Recommendation } from "@/types/recommendations";
import { useToggleSave } from "@/hooks/useRecommendations.tsx";

interface RecommendationSlideCardProps {
  recommendation: Recommendation;
}

export function RecommendationSlideCard({ recommendation }: RecommendationSlideCardProps) {
  const navigate = useNavigate();
  const { mutate: toggleSave } = useToggleSave();

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave({
      recommendationId: recommendation.id,
      isSaved: recommendation.is_saved || false,
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'Restaurant';
      case 'service':
        return 'Service';
      case 'hidden_gem':
        return 'Hidden Gem';
      case 'experience':
        return 'Experience';
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'bg-orange-500/90';
      case 'service':
        return 'bg-blue-500/90';
      case 'hidden_gem':
        return 'bg-purple-500/90';
      case 'experience':
        return 'bg-green-500/90';
      default:
        return 'bg-primary/90';
    }
  };

  return (
    <div
      onClick={() => navigate(`/recommendations/${recommendation.id}`)}
      className="relative flex-shrink-0 w-[160px] h-[220px] rounded-xl overflow-hidden cursor-pointer group"
    >
      {/* Background Image */}
      {recommendation.image_urls?.[0] ? (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
          style={{ backgroundImage: `url(${recommendation.image_urls[0]})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10" />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Type Badge */}
      <div className="absolute top-2 left-2">
        <div className={`${getTypeBadgeColor(recommendation.recommendation_type)} backdrop-blur-sm px-2 py-1 rounded-full`}>
          <span className="text-xs font-medium text-white">
            {getTypeLabel(recommendation.recommendation_type)}
          </span>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveClick}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
      >
        {recommendation.is_saved ? (
          <BookmarkIcon className="h-4 w-4 text-primary" />
        ) : (
          <BookmarkOutlineIcon className="h-4 w-4 text-foreground" />
        )}
      </button>

      {/* Content Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <h3 className="font-semibold text-sm mb-1.5 line-clamp-2">
          {recommendation.title}
        </h3>
        
        {/* Rating & Price */}
        <div className="flex items-center gap-2 mb-1">
          {recommendation.average_rating > 0 && (
            <div className="flex items-center gap-0.5">
              <StarIcon className="h-3 w-3 text-yellow-400" />
              <span className="text-xs font-medium">
                {recommendation.average_rating.toFixed(1)}
              </span>
            </div>
          )}
          {recommendation.price_range && (
            <span className="text-xs font-medium text-white/90">
              {recommendation.price_range}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-white/90">
          <MapPinIcon className="h-3 w-3" />
          <span className="line-clamp-1">
            {recommendation.city}, {recommendation.state}
          </span>
        </div>
      </div>
    </div>
  );
}
