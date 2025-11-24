import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Plus, Sliders } from "@/lib/icons";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { CategoryGrid } from "@/components/recommendations/CategoryGrid";
import { FilterSidebar } from "@/components/recommendations/FilterSidebar";
import { useRecommendations } from "@/hooks/useRecommendations.tsx";
import type { RecommendationFilters } from "@/types/recommendations";
import { useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useAuth } from "@/hooks/useAuth";

export default function Recommendations() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [filters, setFilters] = useState<RecommendationFilters>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data, fetchNextPage, hasNextPage, isLoading } = useRecommendations(filters);

  const allRecommendations = data?.pages.flatMap(page => page.recommendations) || [];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSelectType = (type: string | undefined) => {
    setFilters(prev => ({ ...prev, type: type as any }));
  };

  const handleSelectCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category?.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...(prev.category || []), category],
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
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-16 lg:ml-64 pb-20 md:pb-0 pt-16">
        <div className="container mx-auto px-4 py-4 md:py-6">
          {/* Page Header */}
          <div className="mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Local Recommendations</h1>
                <p className="text-sm md:text-base text-muted-foreground">Discover the best places recommended by locals</p>
              </div>
              <Button onClick={() => navigate('/recommendations/create')} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Recommendation
              </Button>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search restaurants, services, places..."
                  className="pl-10"
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden flex-shrink-0">
                    <Sliders className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <FilterSidebar filters={filters} onChange={setFilters} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Category Grid */}
          <div className="mb-6 md:mb-8">
            <CategoryGrid
              selectedType={filters.type}
              onSelectType={handleSelectType}
              onSelectCategory={handleSelectCategory}
            />
          </div>

          <div className="flex gap-6">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar filters={filters} onChange={setFilters} />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <Tabs defaultValue="all" className="mb-4 md:mb-6">
                <TabsList className="w-full grid grid-cols-5 h-auto">
                  <TabsTrigger value="all" onClick={() => handleSelectType(undefined)} className="text-xs md:text-sm px-2 md:px-3">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="restaurants" onClick={() => handleSelectType('restaurant')} className="text-xs md:text-sm px-2 md:px-3">
                    <span className="hidden sm:inline">Restaurants</span>
                    <span className="sm:hidden">Rest.</span>
                  </TabsTrigger>
                  <TabsTrigger value="services" onClick={() => handleSelectType('service')} className="text-xs md:text-sm px-2 md:px-3">
                    <span className="hidden sm:inline">Services</span>
                    <span className="sm:hidden">Serv.</span>
                  </TabsTrigger>
                  <TabsTrigger value="gems" onClick={() => handleSelectType('hidden_gem')} className="text-xs md:text-sm px-2 md:px-3">
                    <span className="hidden sm:inline">Hidden Gems</span>
                    <span className="sm:hidden">Gems</span>
                  </TabsTrigger>
                  <TabsTrigger value="experiences" onClick={() => handleSelectType('experience')} className="text-xs md:text-sm px-2 md:px-3">
                    <span className="hidden sm:inline">Experiences</span>
                    <span className="sm:hidden">Exp.</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-80" />
                  ))}
                </div>
              ) : allRecommendations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No recommendations found</p>
                  <Button 
                    variant="link" 
                    onClick={() => setFilters({})}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={allRecommendations.length}
                  next={fetchNextPage}
                  hasMore={hasNextPage || false}
                  loader={
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-80" />
                      ))}
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {allRecommendations.map((recommendation) => (
                      <RecommendationCard
                        key={recommendation.id}
                        recommendation={recommendation}
                      />
                    ))}
                  </div>
                </InfiniteScroll>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
