import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type FeedTab = 'for-you' | 'recent' | 'nearby' | 'trending';

interface FeedTabNavigationProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  onCreatePost: () => void;
}

export const FeedTabNavigation = ({ 
  activeTab, 
  onTabChange,
  onCreatePost 
}: FeedTabNavigationProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <ToggleGroup 
        type="single" 
        value={activeTab}
        onValueChange={(value) => value && onTabChange(value as FeedTab)}
        className="justify-start"
      >
        <ToggleGroupItem 
          value="for-you" 
          variant="outline"
          className="rounded-full px-4 py-2 text-sm data-[state=on]:border-foreground data-[state=on]:bg-background"
        >
          For you
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="recent" 
          variant="outline"
          className="rounded-full px-4 py-2 text-sm data-[state=on]:border-foreground data-[state=on]:bg-background"
        >
          Recent
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="nearby" 
          variant="outline"
          className="rounded-full px-4 py-2 text-sm data-[state=on]:border-foreground data-[state=on]:bg-background"
        >
          Nearby
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="trending" 
          variant="outline"
          className="rounded-full px-4 py-2 text-sm data-[state=on]:border-foreground data-[state=on]:bg-background"
        >
          Trending
        </ToggleGroupItem>
      </ToggleGroup>

      <Button 
        onClick={onCreatePost}
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-2 flex-shrink-0"
        size="sm"
      >
        <Plus className="h-4 w-4 mr-1" />
        Post
      </Button>
    </div>
  );
};
