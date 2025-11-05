import { useState } from "react";
import { CardTitle } from "@/components/ui/card";
import { CommunityFeedFilters, CommunityFilters } from "@/components/CommunityFeedFilters";
import { useProfile } from "@/hooks/useProfile";

export const CommunityFeedHeaderSection = () => {
  const { profile } = useProfile();
  const [filters, setFilters] = useState<CommunityFilters>({
    locationScope: profile?.city ? 'city' : 'all',
    tags: [],
    postTypes: 'all',
    sortBy: 'newest',
    dateRange: 'all',
  });

  // Extract available tags - you may need to get this from a hook or context
  const availableTags: string[] = [];
  
  // Count active filters
  const activeFiltersCount = 
    (filters.tags?.length || 0) + 
    (filters.postTypes !== 'all' ? 1 : 0) + 
    (filters.dateRange !== 'all' ? 1 : 0);

  return (
    <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
      <CardTitle className="text-lg sm:text-xl md:text-xl">Community Updates</CardTitle>
      
      <div className="flex-shrink-0">
        <CommunityFeedFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={availableTags}
          activeFiltersCount={activeFiltersCount}
          userLocation={{
            state: profile?.state,
            city: profile?.city,
            neighborhood: profile?.neighborhood
          }}
        />
      </div>
    </div>
  );
};
