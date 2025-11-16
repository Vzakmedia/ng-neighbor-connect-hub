import { PlusIcon, EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type FeedTab = 'for-you' | 'recent' | 'nearby' | 'trending';
type LocationScope = 'neighborhood' | 'city' | 'state';

interface FeedTabNavigationProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  onCreatePost: () => void;
  selectedLocationScope?: LocationScope | null;
  onLocationScopeChange: (scope: LocationScope | null) => void;
}

export const FeedTabNavigation = ({ 
  activeTab, 
  onTabChange,
  onCreatePost,
  selectedLocationScope,
  onLocationScopeChange
}: FeedTabNavigationProps) => {
  const locationScopeLabels: Record<LocationScope, string> = {
    neighborhood: 'Neighborhood',
    city: 'City',
    state: 'State'
  };

  return (
    <>
    <div className="flex items-center justify-between gap-2 md:gap-4">
      <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0">
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as FeedTab)}>
          <TabsList className="h-auto p-0">
            <TabsTrigger 
              value="for-you"
              className="whitespace-nowrap"
            >
              For you
            </TabsTrigger>
            <TabsTrigger 
              value="recent"
              className="whitespace-nowrap"
            >
              Recent
            </TabsTrigger>
            <TabsTrigger 
              value="nearby"
              className="whitespace-nowrap"
            >
              Nearby
            </TabsTrigger>
            <TabsTrigger 
              value="trending"
              className="whitespace-nowrap"
            >
              Trending
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-2 md:px-3 py-1.5 md:py-2 h-auto flex-shrink-0 touch-manipulation active:scale-95 transition-all"
            >
              <EllipsisHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="bg-background border shadow-lg z-50"
          >
            <DropdownMenuItem 
              onClick={() => onLocationScopeChange('neighborhood')}
              className="cursor-pointer"
            >
              Neighborhood
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onLocationScopeChange('city')}
              className="cursor-pointer"
            >
              City
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onLocationScopeChange('state')}
              className="cursor-pointer"
            >
              State
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedLocationScope && (
          <Badge 
            variant="secondary"
            className="rounded-full px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm flex items-center gap-1 md:gap-1.5 bg-primary/10 text-primary border-primary/20 whitespace-nowrap flex-shrink-0"
          >
            {locationScopeLabels[selectedLocationScope]}
            <button
              onClick={() => onLocationScopeChange(null)}
              className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      {/* Desktop Post Button - Inline with tabs */}
      <Button 
        onClick={onCreatePost}
        className="hidden lg:flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-3 md:px-4 py-1.5 md:py-2 flex-shrink-0 touch-manipulation active:scale-95 transition-all"
        size="sm"
      >
        <PlusIcon className="h-4 w-4 md:mr-1" />
        <span className="hidden md:inline">Post</span>
      </Button>
    </div>

    {/* Mobile/Tablet Floating Action Button */}
    <Button 
      onClick={onCreatePost}
      className="lg:hidden fixed bottom-24 right-4 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-95"
      size="icon"
    >
      <PlusIcon className="h-6 w-6" />
    </Button>
    </>
  );
};
