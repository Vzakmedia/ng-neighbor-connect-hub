import { MagnifyingGlassIcon, ArrowPathIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommunityFeedFilters, CommunityFilters } from "./CommunityFeedFilters";

interface CommunityFeedHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasNewContent: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  unreadCount: number;
  filters: CommunityFilters;
  onFiltersChange: (filters: CommunityFilters) => void;
  availableTags: string[];
  activeFiltersCount: number;
  onMarkAllRead?: () => void;
  userLocation?: {
    state?: string;
    city?: string;
    neighborhood?: string;
  };
}

export const CommunityFeedHeader = ({
  searchQuery,
  onSearchChange,
  hasNewContent,
  onRefresh,
  refreshing,
  unreadCount,
  filters,
  onFiltersChange,
  availableTags,
  activeFiltersCount,
  onMarkAllRead,
  userLocation
}: CommunityFeedHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
      <div className="flex flex-col space-y-4">
        {unreadCount > 0 && (
          <div className="flex justify-center items-center gap-2">
            <Badge variant="secondary" className="animate-pulse">
              {unreadCount} new
            </Badge>
            {onMarkAllRead && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onMarkAllRead}
                className="h-6 text-xs"
              >
                <CheckIcon className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-shrink-0">
            <CommunityFeedFilters
              filters={filters}
              onFiltersChange={onFiltersChange}
              availableTags={availableTags}
              activeFiltersCount={activeFiltersCount}
              userLocation={userLocation}
            />
          </div>
        </div>

      </div>
    </div>
  );
};