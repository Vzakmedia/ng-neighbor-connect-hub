import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { FilterSection } from "@/components/ui/filter-section";
import { PriceHistogram } from "./PriceHistogram";
import type { RecommendationFilters } from "@/types/recommendations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RecommendationFilters;
  onChange: (filters: RecommendationFilters) => void;
  totalResults?: number;
}

const PRICE_RANGES = ['₦', '₦₦', '₦₦₦', '₦₦₦₦'] as const;
const RECOMMENDATION_TYPES = [
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'service', label: 'Services' },
  { value: 'hidden_gem', label: 'Hidden Gems' },
  { value: 'experience', label: 'Experiences' },
] as const;

const POPULAR_TAGS = [
  'family-friendly',
  'outdoor-seating',
  'vegan-options',
  'parking',
  'wifi',
  'air-conditioned',
  'delivery',
  'takeout',
  'reservations',
  'pet-friendly',
];

export function FilterModal({ open, onOpenChange, filters, onChange, totalResults = 0 }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['recommendation-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommendation_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: priceDistribution = [] } = useQuery({
    queryKey: ['price-distribution'],
    queryFn: async () => {
      const counts = await Promise.all(
        PRICE_RANGES.map(async (range) => {
          const { count } = await supabase
            .from('recommendations')
            .select('*', { count: 'exact', head: true })
            .eq('price_range', range)
            .eq('status', 'approved');
          return { range, count: count || 0 };
        })
      );
      return counts;
    },
  });

  const updateFilter = <K extends keyof RecommendationFilters>(
    key: K,
    value: RecommendationFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleCategory = (slug: string) => {
    const current = filters.category || [];
    const updated = current.includes(slug)
      ? current.filter(c => c !== slug)
      : [...current, slug];
    updateFilter('category', updated);
  };

  const togglePriceRange = (range: typeof PRICE_RANGES[number]) => {
    const current = filters.priceRange || [];
    const updated = current.includes(range)
      ? current.filter(p => p !== range)
      : [...current, range];
    updateFilter('priceRange', updated);
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags || [];
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    updateFilter('tags', updated);
  };

  const clearAll = () => {
    onChange({});
  };

  const applyFilters = () => {
    onOpenChange(false);
  };

  const content = (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="price" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="w-full justify-start overflow-x-auto flex-shrink-0">
          <TabsTrigger value="price">Price</TabsTrigger>
          <TabsTrigger value="type">Type & Category</TabsTrigger>
          <TabsTrigger value="rating">Rating & Distance</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-6">
          <TabsContent value="price" className="mt-0 space-y-4">
            <div>
              <h3 className="font-medium mb-4">Price Range</h3>
              <div className="flex gap-2 mb-2">
                {PRICE_RANGES.map((range) => (
                  <Badge
                    key={range}
                    variant={filters.priceRange?.includes(range) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2"
                    onClick={() => togglePriceRange(range)}
                  >
                    {range}
                  </Badge>
                ))}
              </div>
              <PriceHistogram 
                data={priceDistribution}
                selectedRanges={filters.priceRange || []}
                onRangeClick={togglePriceRange}
              />
            </div>
          </TabsContent>

          <TabsContent value="type" className="mt-0 space-y-6">
            <FilterSection title="Recommendation Type" defaultOpen>
              <div className="space-y-3">
                {RECOMMENDATION_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={filters.type === type.value}
                      onCheckedChange={(checked) => 
                        updateFilter('type', checked ? type.value : undefined)
                      }
                    />
                    <Label htmlFor={type.value} className="cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Categories" defaultOpen>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.slug} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.slug}
                      checked={filters.category?.includes(category.slug)}
                      onCheckedChange={() => toggleCategory(category.slug)}
                    />
                    <Label htmlFor={category.slug} className="cursor-pointer">
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </FilterSection>
          </TabsContent>

          <TabsContent value="rating" className="mt-0 space-y-6">
            <FilterSection title="Minimum Rating" defaultOpen>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Rating: {filters.minRating || 0} stars</Label>
                </div>
                <Slider
                  value={[filters.minRating || 0]}
                  onValueChange={(value) => updateFilter('minRating', value[0])}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </FilterSection>

            <FilterSection title="Distance" defaultOpen>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Within {filters.distance || 50} km</Label>
                </div>
                <Slider
                  value={[filters.distance || 50]}
                  onValueChange={(value) => updateFilter('distance', value[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </FilterSection>
          </TabsContent>

          <TabsContent value="features" className="mt-0 space-y-6">
            <FilterSection title="Quick Filters" defaultOpen>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={filters.verifiedOnly || false}
                    onCheckedChange={(checked) => updateFilter('verifiedOnly', checked as boolean)}
                  />
                  <Label htmlFor="verified" className="cursor-pointer">
                    Verified only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="openNow"
                    checked={filters.openNow || false}
                    onCheckedChange={(checked) => updateFilter('openNow', checked as boolean)}
                  />
                  <Label htmlFor="openNow" className="cursor-pointer">
                    Open now
                  </Label>
                </div>
              </div>
            </FilterSection>

            <FilterSection title="Tags" defaultOpen>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags?.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </FilterSection>
          </TabsContent>
        </div>
      </Tabs>

      <div className="border-t p-4 flex items-center justify-between gap-3 flex-shrink-0 bg-background">
        <Button variant="ghost" onClick={clearAll}>
          Reset
        </Button>
        <Button onClick={applyFilters} className="flex-1 sm:flex-none">
          Show {totalResults} results
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 flex-shrink-0">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
