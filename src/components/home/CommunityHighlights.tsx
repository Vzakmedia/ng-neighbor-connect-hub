import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowTrendingUpIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useTrendingTopics } from "@/hooks/useDashboardSections";

export const CommunityHighlights = () => {
  const navigate = useNavigate();
  const { topics, loading } = useTrendingTopics(3);

  if (loading || topics.length === 0) return null;

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Trending in Your Community</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-primary"
        >
          View All
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => navigate(`/?tag=${encodeURIComponent(topic.tag)}`)}
            className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            {topic.tag} <span className="text-muted-foreground ml-1">({topic.posts})</span>
          </button>
        ))}
      </div>
    </div>
  );
};
