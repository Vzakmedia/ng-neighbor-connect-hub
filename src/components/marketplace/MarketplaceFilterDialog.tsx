import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PillFilter, PillOption } from "@/components/ui/pill-filter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface FilterState {
  category: string[];
  priceRange: string[];
  rating: string[];
  condition: string[];
  availability: string[];
  negotiable: string[];
}

interface MarketplaceFilterDialogProps {
  activeSubTab: "services" | "goods";
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

const serviceCategoryOptions: PillOption[] = [
  { value: "all", label: "All Services" },
  { value: "home_repair", label: "Home Repair" },
  { value: "tutoring", label: "Tutoring" },
  { value: "nanny", label: "Nanny" },
  { value: "cleaning", label: "Cleaning" },
  { value: "tech_support", label: "Tech Support" },
  { value: "beauty", label: "Beauty & Wellness" },
];

const goodsCategoryOptions: PillOption[] = [
  { value: "all", label: "All Items" },
  { value: "electronics", label: "Electronics" },
  { value: "furniture", label: "Furniture" },
  { value: "clothing", label: "Clothing" },
  { value: "vehicles", label: "Vehicles" },
  { value: "books", label: "Books" },
  { value: "sports", label: "Sports & Outdoors" },
];

const servicePriceOptions: PillOption[] = [
  { value: "budget", label: "Under ₦5,000" },
  { value: "standard", label: "₦5,000 - ₦20,000" },
  { value: "premium", label: "₦20,000+" },
];

const goodsPriceOptions: PillOption[] = [
  { value: "low", label: "Under ₦10,000" },
  { value: "mid", label: "₦10,000 - ₦50,000" },
  { value: "high", label: "₦50,000 - ₦100,000" },
  { value: "premium", label: "Over ₦100,000" },
];

const ratingOptions: PillOption[] = [
  { value: "4+", label: "4+ Stars" },
  { value: "3+", label: "3+ Stars" },
  { value: "2+", label: "2+ Stars" },
  { value: "any", label: "Any Rating" },
];

const conditionOptions: PillOption[] = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "for_parts", label: "For Parts" },
];

const availabilityOptions: PillOption[] = [
  { value: "now", label: "Available Now" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "flexible", label: "Flexible" },
];

const negotiableOptions: PillOption[] = [
  { value: "negotiable", label: "Negotiable Only" },
  { value: "fixed", label: "Fixed Price" },
  { value: "all", label: "All" },
];

export function MarketplaceFilterDialog({
  activeSubTab,
  onFilterChange,
  initialFilters,
}: MarketplaceFilterDialogProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(
    initialFilters || {
      category: ["all"],
      priceRange: [],
      rating: [],
      condition: [],
      availability: [],
      negotiable: [],
    }
  );

  const activeFilterCount = Object.values(localFilters).reduce((count, filterArray) => {
    if (filterArray.includes("all")) return count;
    return count + filterArray.length;
  }, 0);

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      category: ["all"],
      priceRange: [],
      rating: [],
      condition: [],
      availability: [],
      negotiable: [],
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    setOpen(false);
  };

  const FilterContent = () => (
    <Tabs defaultValue="category" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="category">Category</TabsTrigger>
        <TabsTrigger value="price">Price</TabsTrigger>
        {activeSubTab === "services" && <TabsTrigger value="rating">Rating</TabsTrigger>}
        {activeSubTab === "services" && <TabsTrigger value="availability">Availability</TabsTrigger>}
        {activeSubTab === "goods" && <TabsTrigger value="condition">Condition</TabsTrigger>}
        {activeSubTab === "goods" && <TabsTrigger value="negotiable">Negotiable</TabsTrigger>}
      </TabsList>

      <div className="mt-4 space-y-4">
        <TabsContent value="category" className="space-y-2">
          <h4 className="text-sm font-medium">Select Category</h4>
          <PillFilter
            options={activeSubTab === "services" ? serviceCategoryOptions : goodsCategoryOptions}
            value={localFilters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
            mode="single"
          />
        </TabsContent>

        <TabsContent value="price" className="space-y-2">
          <h4 className="text-sm font-medium">Price Range</h4>
          <PillFilter
            options={activeSubTab === "services" ? servicePriceOptions : goodsPriceOptions}
            value={localFilters.priceRange}
            onValueChange={(value) => handleFilterChange("priceRange", value)}
            mode="multiple"
          />
        </TabsContent>

        {activeSubTab === "services" && (
          <TabsContent value="rating" className="space-y-2">
            <h4 className="text-sm font-medium">Minimum Rating</h4>
            <PillFilter
              options={ratingOptions}
              value={localFilters.rating}
              onValueChange={(value) => handleFilterChange("rating", value)}
              mode="single"
            />
          </TabsContent>
        )}

        {activeSubTab === "services" && (
          <TabsContent value="availability" className="space-y-2">
            <h4 className="text-sm font-medium">Availability</h4>
            <PillFilter
              options={availabilityOptions}
              value={localFilters.availability}
              onValueChange={(value) => handleFilterChange("availability", value)}
              mode="multiple"
            />
          </TabsContent>
        )}

        {activeSubTab === "goods" && (
          <TabsContent value="condition" className="space-y-2">
            <h4 className="text-sm font-medium">Condition</h4>
            <PillFilter
              options={conditionOptions}
              value={localFilters.condition}
              onValueChange={(value) => handleFilterChange("condition", value)}
              mode="multiple"
            />
          </TabsContent>
        )}

        {activeSubTab === "goods" && (
          <TabsContent value="negotiable" className="space-y-2">
            <h4 className="text-sm font-medium">Price Type</h4>
            <PillFilter
              options={negotiableOptions}
              value={localFilters.negotiable}
              onValueChange={(value) => handleFilterChange("negotiable", value)}
              mode="single"
            />
          </TabsContent>
        )}
      </div>

      <div className="flex gap-2 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={handleReset} className="flex-1">
          Reset
        </Button>
        <Button onClick={handleApply} className="flex-1">
          Find Results
        </Button>
      </div>
    </Tabs>
  );

  const TriggerButton = (
    <Button variant="outline" size="icon" className="relative">
      <Filter className="w-4 h-4" />
      {activeFilterCount > 0 && (
        <Badge variant="default" className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <FilterContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] p-4">
        <FilterContent />
      </PopoverContent>
    </Popover>
  );
}
