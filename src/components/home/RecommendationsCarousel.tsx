import { useNavigate } from "react-router-dom";
import { SparklesIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useFeedRecommendations } from "@/hooks/useFeedRecommendations";
import { RecommendationSlideCard } from "./RecommendationSlideCard";

export function RecommendationsCarousel() {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useFeedRecommendations();

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            Top Picks for You
          </h2>
          <button className="text-sm text-primary font-medium flex items-center gap-1">
            View All
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="overflow-x-auto scrollbar-hide px-4">
          <div className="flex gap-3 pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[160px] h-[220px] bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          Top Picks for You
        </h2>
        <button 
          onClick={() => navigate('/recommendations')}
          className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
        >
          View All
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-3 pb-2">
          {recommendations.map((recommendation) => (
            <RecommendationSlideCard 
              key={recommendation.id} 
              recommendation={recommendation} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
