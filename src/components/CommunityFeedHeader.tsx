import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CommunityFeedHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasNewContent: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  unreadCount: number;
}

export const CommunityFeedHeader = ({
  searchQuery,
  onSearchChange,
  hasNewContent,
  onRefresh,
  refreshing,
  unreadCount
}: CommunityFeedHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Community Feed</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="animate-pulse">
                {unreadCount} new
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {hasNewContent && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="animate-fade-in gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              New posts available
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};