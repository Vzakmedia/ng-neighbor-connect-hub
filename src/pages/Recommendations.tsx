import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Sliders } from "@/lib/icons";
import { CategoryPills } from "@/components/recommendations/CategoryPills";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { FilterModal } from "@/components/recommendations/FilterModal";
import { useRecommendations } from "@/hooks/useRecommendations.tsx";
import type { RecommendationFilters } from "@/types/recommendations";
import InfiniteScroll from "react-infinite-scroll-component";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Recommendations() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [filters, setFilters] = useState<RecommendationFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data, fetchNextPage, hasNextPage, isLoading } = useRecommendations(filters);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleCategoryFilter = (slug: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category?.includes(slug)
        ? prev.category.filter(c => c !== slug)
        : [...(prev.category || []), slug]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <main className="md:ml-16 lg:ml-64 pb-20 md:pb-0 pt-2 md:pt-0">
        <div className="container px-0 lg:px-6 pt-1 sm:pt-2 md:pt-3 pb-3 sm:pb-4 md:pb-6 space-y-3 sm:space-y-4 max-w-7xl">
          {/* Search and Filter Bar */}
          <div className="flex gap-2 sticky top-2 md:top-0 z-10 py-2 px-4 lg:px-0 border-b bg-background/80 backdrop-blur-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recommendations..."
                value={filters.search || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 rounded-full border-border"
              />
            </div>
            <Button 
              variant="outline" 
              className="flex-shrink-0 gap-2 rounded-full"
              onClick={() => setShowFilters(true)}
            >
              <Sliders className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button 
              onClick={() => navigate("/recommendations/create")}
              className="flex-shrink-0 gap-2 rounded-full"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>

          {/* Category Pills */}
          <CategoryPills 
            selectedCategories={filters.category || []}
            onSelectCategory={handleCategoryFilter}
          />

          {/* Recommendations Grid */}
          <div className="pt-2">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <InfiniteScroll
                dataLength={data?.pages.flatMap(p => p.recommendations).length || 0}
                next={fetchNextPage}
                hasMore={hasNextPage || false}
                loader={
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {data?.pages.flatMap(page => page.recommendations).map(recommendation => (
                    <RecommendationCard 
                      key={recommendation.id} 
                      recommendation={recommendation}
                    />
                  ))}
                </div>
              </InfiniteScroll>
            )}

            {!isLoading && data?.pages[0]?.recommendations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No recommendations found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setFilters({})}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>

      {/* Filter Modal */}
      <FilterModal 
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onChange={setFilters}
        totalResults={data?.pages[0]?.totalCount || 0}
      />
    </>
  );
}
