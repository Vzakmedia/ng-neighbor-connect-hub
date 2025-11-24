import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterSection } from "@/components/ui/filter-section";
import type { RecommendationFilters } from "@/types/recommendations";

interface Props {
  filters: RecommendationFilters;
  onChange: (filters: RecommendationFilters) => void;
  categories?: { name: string; slug: string }[];
}

const PRICE_RANGES = ['₦', '₦₦', '₦₦₦', '₦₦₦₦'] as const;
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

export function FilterSidebar({ filters, onChange, categories = [] }: Props) {
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

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card className="p-4 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <FilterSection title="Categories" defaultOpen>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.slug} className="flex items-center space-x-2">
                <Checkbox
                  id={category.slug}
                  checked={filters.category?.includes(category.slug)}
                  onCheckedChange={() => toggleCategory(category.slug)}
                />
                <Label
                  htmlFor={category.slug}
                  className="text-sm cursor-pointer"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Price Range">
          <div className="flex gap-2">
            {PRICE_RANGES.map((range) => (
              <Badge
                key={range}
                variant={filters.priceRange?.includes(range) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => togglePriceRange(range)}
              >
                {range}
              </Badge>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Rating">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Minimum Rating: {filters.minRating || 0}</Label>
              <Slider
                value={[filters.minRating || 0]}
                onValueChange={(value) => updateFilter('minRating', value[0])}
                max={5}
                step={0.5}
                className="w-full"
              />
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Distance">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Within {filters.distance || 50} km</Label>
              <Slider
                value={[filters.distance || 50]}
                onValueChange={(value) => updateFilter('distance', value[0])}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Features">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.verifiedOnly || false}
                onCheckedChange={(checked) => updateFilter('verifiedOnly', checked as boolean)}
              />
              <Label htmlFor="verified" className="text-sm cursor-pointer">
                Verified only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="openNow"
                checked={filters.openNow || false}
                onCheckedChange={(checked) => updateFilter('openNow', checked as boolean)}
              />
              <Label htmlFor="openNow" className="text-sm cursor-pointer">
                Open now
              </Label>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Tags">
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
      </div>
    </Card>
  );
}
