import { useState, useMemo } from "react";
import { FunnelIcon, XMarkIcon, CalendarIcon, MapPinIcon, TagIcon, UsersIcon, AdjustmentsHorizontalIcon, MagnifyingGlassIcon, GlobeAltIcon, HomeIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilterSection } from "@/components/ui/filter-section";
import { cn } from "@/lib/utils";

// Nigerian states organized by geopolitical zones
export const NIGERIAN_ZONES = {
  "South West": ["Lagos", "Ogun", "Oyo", "Osun", "Ondo", "Ekiti"],
  "South South": ["Rivers", "Bayelsa", "Delta", "Edo", "Cross River", "Akwa Ibom"],
  "South East": ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
  "North Central": ["Federal Capital Territory", "Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau"],
  "North East": ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
  "North West": ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara"],
};

export const POST_CATEGORIES = [
  "Community News",
  "Lost & Found",
  "Recommendations",
  "Help Needed",
  "Local Business",
  "Events",
  "Safety & Security",
  "Announcements",
  "Buy & Sell",
  "Questions",
];

export const DATE_RANGES = [
  "Today",
  "This Week",
  "This Month",
  "Last 3 Months",
  "Last 6 Months",
  "This Year",
];

export interface AdvancedFilters {
  states: string[];
  categories: string[];
  dateRanges: string[];
}

export interface CommunityFilters {
  tags: string[];
  locationScope: string;
  postTypes: string;
  dateRange: string;
  sortBy: string;
  advancedFilters?: AdvancedFilters;
}

interface CommunityFeedFiltersProps {
  filters: CommunityFilters;
  onFiltersChange: (filters: CommunityFilters) => void;
  availableTags: string[];
  activeFiltersCount: number;
  userLocation?: {
    state?: string;
    city?: string;
    neighborhood?: string;
  };
}

export const CommunityFeedFilters = ({
  filters,
  onFiltersChange,
  availableTags,
  activeFiltersCount,
  userLocation
}: CommunityFeedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  // Create dynamic location options with user's actual location
  const locationScopeOptions = useMemo(() => {
    const baseOptions = [
      { 
        value: 'all', 
        label: 'All Areas', 
        shortLabel: 'All', 
        icon: GlobeAltIcon, 
        description: 'See posts from everywhere',
        fullLabel: 'All Areas'
      },
    ];
    
    if (userLocation?.neighborhood && userLocation?.city) {
      baseOptions.push({
        value: 'neighborhood',
        label: 'My Ward',
        shortLabel: 'Ward',
        icon: HomeIcon,
        description: `People in ${userLocation.neighborhood} ward`,
        fullLabel: `${userLocation.neighborhood} Ward`
      });
    }
    
    if (userLocation?.city && userLocation?.state) {
      baseOptions.push({
        value: 'city',
        label: 'My LGA',
        shortLabel: 'LGA',
        icon: BuildingOfficeIcon,
        description: `People in ${userLocation.city} LGA`,
        fullLabel: `${userLocation.city} LGA`
      });
    }
    
    if (userLocation?.state) {
      baseOptions.push({
        value: 'state',
        label: 'My State',
        shortLabel: 'State',
        icon: MapPinIcon,
        description: `People in ${userLocation.state} state`,
        fullLabel: `${userLocation.state} State`
      });
    }
    
    return baseOptions;
  }, [userLocation]);

  const postTypeOptions = [
    { value: 'all', label: 'All Types', shortLabel: 'All', icon: UsersIcon },
    { value: 'events', label: 'Events', shortLabel: 'Events', icon: CalendarIcon },
    { value: 'general', label: 'General Posts', shortLabel: 'Posts', icon: UsersIcon }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_liked', label: 'Most Liked' },
    { value: 'most_commented', label: 'Most Commented' }
  ];

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !filters.tags.includes(tag.trim())) {
      onFiltersChange({ ...filters, tags: [...filters.tags, tag.trim()] });
      setTagSearch("");
    }
  };

  const handleTagRemove = (tag: string) => {
    onFiltersChange({ 
      ...filters, 
      tags: filters.tags.filter(t => t !== tag) 
    });
  };

  const filteredAvailableTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(tagSearch.toLowerCase()) && 
    !filters.tags.includes(tag)
  );

  const clearAllFilters = () => {
    onFiltersChange({
      tags: [],
      locationScope: 'all',
      postTypes: 'all',
      dateRange: 'all',
      sortBy: 'newest',
      advancedFilters: { states: [], categories: [], dateRanges: [] }
    });
  };

  const clearFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'tags':
        if (value) {
          onFiltersChange({ 
            ...filters, 
            tags: filters.tags.filter(t => t !== value) 
          });
        }
        break;
      case 'locationScope':
        onFiltersChange({ ...filters, locationScope: 'all' });
        break;
      case 'postTypes':
        onFiltersChange({ ...filters, postTypes: 'all' });
        break;
      case 'dateRange':
        onFiltersChange({ ...filters, dateRange: 'all' });
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter Button and Sidebar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "relative gap-2 bg-card/50 border-border/50 hover:bg-accent/50 hover:border-accent transition-all duration-200",
                isOpen && "bg-accent border-accent-foreground"
              )}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="default" 
                  className="ml-1 h-5 min-w-5 text-xs bg-primary/90 hover:bg-primary"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent 
            side="right" 
            className="w-full sm:max-w-md overflow-hidden flex flex-col p-0"
          >
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              <SheetTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 text-primary" />
                  <span>Filters</span>
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-destructive h-8"
                  >
                    Reset All
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="flex-1">
              <div className="space-y-6 px-6 py-6">
                {/* Sort & Period */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sort</Label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Period</Label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateRangeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Content Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    Content Type
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {postTypeOptions.map((option) => {
                      const isSelected = filters.postTypes === option.value;
                      return (
                        <Badge
                          key={option.value}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer transition-colors"
                          onClick={() => onFiltersChange({ ...filters, postTypes: option.value })}
                        >
                          {option.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Location Scope */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    Show Posts From
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {locationScopeOptions.map((option) => {
                      const isSelected = filters.locationScope === option.value;
                      return (
                        <Badge
                          key={option.value}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer transition-colors"
                          onClick={() => onFiltersChange({ ...filters, locationScope: option.value })}
                        >
                          {option.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Tags
                  </Label>
                  
                  {/* Tag Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search or add tags..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagSearch.trim()) {
                          handleTagAdd(tagSearch);
                        }
                      }}
                      className="pl-9"
                    />
                  </div>

                  {/* Selected Tags */}
                  {filters.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filters.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="default"
                          className="gap-1 cursor-pointer hover:bg-destructive/20 transition-colors"
                          onClick={() => handleTagRemove(tag)}
                        >
                          #{tag}
                          <XMarkIcon className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Tag Suggestions */}
                  {tagSearch && filteredAvailableTags.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2 bg-muted/20">
                      {filteredAvailableTags.slice(0, 10).map(tag => (
                        <div
                          key={tag}
                          onClick={() => handleTagAdd(tag)}
                          className="text-sm p-2 hover:bg-accent rounded cursor-pointer transition-colors"
                        >
                          #{tag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Separator between basic and advanced filters */}
                <Separator className="my-6" />

                {/* Advanced Filters Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Advanced Filters</h3>
                  
                  {/* Location by Zone */}
                  {Object.entries(NIGERIAN_ZONES).map(([zone, states]) => (
                    <FilterSection 
                      key={zone}
                      title={`📍 ${zone}`}
                      defaultOpen={zone === "South West"}
                    >
                      <div className="flex flex-wrap gap-2">
                        {states.map((state) => {
                          const isSelected = filters.advancedFilters?.states?.includes(state);
                          return (
                            <Badge
                              key={state}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer transition-colors"
                              onClick={() => {
                                const currentStates = filters.advancedFilters?.states || [];
                                const newStates = isSelected
                                  ? currentStates.filter(s => s !== state)
                                  : [...currentStates, state];
                                onFiltersChange({
                                  ...filters,
                                  advancedFilters: {
                                    ...filters.advancedFilters,
                                    states: newStates,
                                    categories: filters.advancedFilters?.categories || [],
                                    dateRanges: filters.advancedFilters?.dateRanges || [],
                                  }
                                });
                              }}
                            >
                              {state}
                            </Badge>
                          );
                        })}
                      </div>
                    </FilterSection>
                  ))}

                  {/* Categories */}
                  <FilterSection title="🏷️ Categories">
                    <div className="flex flex-wrap gap-2">
                      {POST_CATEGORIES.map((category) => {
                        const isSelected = filters.advancedFilters?.categories?.includes(category);
                        return (
                          <Badge
                            key={category}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer transition-colors"
                            onClick={() => {
                              const currentCategories = filters.advancedFilters?.categories || [];
                              const newCategories = isSelected
                                ? currentCategories.filter(c => c !== category)
                                : [...currentCategories, category];
                              onFiltersChange({
                                ...filters,
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  states: filters.advancedFilters?.states || [],
                                  categories: newCategories,
                                  dateRanges: filters.advancedFilters?.dateRanges || [],
                                }
                              });
                            }}
                          >
                            {category}
                          </Badge>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* Date Ranges */}
                  <FilterSection title="📅 Time Period">
                    <div className="flex flex-wrap gap-2">
                      {DATE_RANGES.map((range) => {
                        const isSelected = filters.advancedFilters?.dateRanges?.includes(range);
                        return (
                          <Badge
                            key={range}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer transition-colors"
                            onClick={() => {
                              const currentRanges = filters.advancedFilters?.dateRanges || [];
                              const newRanges = isSelected
                                ? currentRanges.filter(r => r !== range)
                                : [...currentRanges, range];
                              onFiltersChange({
                                ...filters,
                                advancedFilters: {
                                  ...filters.advancedFilters,
                                  states: filters.advancedFilters?.states || [],
                                  categories: filters.advancedFilters?.categories || [],
                                  dateRanges: newRanges,
                                }
                              });
                            }}
                          >
                            {range}
                          </Badge>
                        );
                      })}
                    </div>
                  </FilterSection>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Active Filters Display - Inline */}
        {activeFiltersCount > 0 && (
          <>
            <div className="flex items-center gap-1 flex-wrap">
              {/* Tags */}
              {filters.tags.map(tag => (
                <Badge
                  key={`tag-${tag}`}
                  variant="default"
                  className="gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <TagIcon className="h-2 w-2" />
                  #{tag.length > 6 ? tag.substring(0, 6) + '...' : tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-primary/20 text-primary hover:text-primary/80"
                    onClick={() => clearFilter('tags', tag)}
                  >
                    <XMarkIcon className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}

              {/* Location Scope */}
              {filters.locationScope !== 'all' && (
                <Badge
                  variant="default"
                  className="gap-1 px-2 py-0.5 text-xs bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30 transition-colors"
                >
                  <MapPinIcon className="h-2 w-2" />
                  <span className="hidden sm:inline">{locationScopeOptions.find(opt => opt.value === filters.locationScope)?.fullLabel || locationScopeOptions.find(opt => opt.value === filters.locationScope)?.label}</span>
                  <span className="sm:hidden">{locationScopeOptions.find(opt => opt.value === filters.locationScope)?.shortLabel}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-accent/30"
                    onClick={() => clearFilter('locationScope')}
                  >
                    <XMarkIcon className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {/* Post Types */}
              {filters.postTypes !== 'all' && (
                <Badge
                  variant="default"
                  className="gap-1 px-2 py-0.5 text-xs bg-secondary/50 text-secondary-foreground border-secondary/30 hover:bg-secondary/70 transition-colors"
                >
                  <UsersIcon className="h-2 w-2" />
                  <span className="hidden sm:inline">{postTypeOptions.find(opt => opt.value === filters.postTypes)?.label}</span>
                  <span className="sm:hidden">{postTypeOptions.find(opt => opt.value === filters.postTypes)?.shortLabel}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-secondary/70"
                    onClick={() => clearFilter('postTypes')}
                  >
                    <XMarkIcon className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {/* Date Range */}
              {filters.dateRange !== 'all' && (
                <Badge 
                  variant="default" 
                  className="gap-1 px-2 py-0.5 text-xs bg-muted/50 text-muted-foreground border-muted/30 hover:bg-muted/70 transition-colors"
                >
                  <CalendarIcon className="h-2 w-2" />
                  <span className="hidden sm:inline">{dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}</span>
                  <span className="sm:hidden">{filters.dateRange}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-muted/70"
                    onClick={() => clearFilter('dateRange')}
                  >
                    <XMarkIcon className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {/* Advanced Filters - States */}
              {filters.advancedFilters?.states && filters.advancedFilters.states.length > 0 && (
                filters.advancedFilters.states.map((state) => (
                  <Badge
                    key={state}
                    variant="secondary"
                    className="gap-1 px-2 py-0.5 text-xs cursor-pointer hover:bg-destructive/20 transition-colors"
                    onClick={() => {
                      const newStates = filters.advancedFilters!.states.filter(s => s !== state);
                      onFiltersChange({
                        ...filters,
                        advancedFilters: {
                          ...filters.advancedFilters!,
                          states: newStates,
                        }
                      });
                    }}
                  >
                    📍 {state}
                    <XMarkIcon className="h-2 w-2" />
                  </Badge>
                ))
              )}

              {/* Advanced Filters - Categories */}
              {filters.advancedFilters?.categories && filters.advancedFilters.categories.length > 0 && (
                filters.advancedFilters.categories.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="gap-1 px-2 py-0.5 text-xs cursor-pointer hover:bg-destructive/20 transition-colors"
                    onClick={() => {
                      const newCategories = filters.advancedFilters!.categories.filter(c => c !== category);
                      onFiltersChange({
                        ...filters,
                        advancedFilters: {
                          ...filters.advancedFilters!,
                          categories: newCategories,
                        }
                      });
                    }}
                  >
                    🏷️ {category}
                    <XMarkIcon className="h-2 w-2" />
                  </Badge>
                ))
              )}

              {/* Advanced Filters - Date Ranges */}
              {filters.advancedFilters?.dateRanges && filters.advancedFilters.dateRanges.length > 0 && (
                filters.advancedFilters.dateRanges.map((range) => (
                  <Badge
                    key={range}
                    variant="secondary"
                    className="gap-1 px-2 py-0.5 text-xs cursor-pointer hover:bg-destructive/20 transition-colors"
                    onClick={() => {
                      const newRanges = filters.advancedFilters!.dateRanges.filter(r => r !== range);
                      onFiltersChange({
                        ...filters,
                        advancedFilters: {
                          ...filters.advancedFilters!,
                          dateRanges: newRanges,
                        }
                      });
                    }}
                  >
                    📅 {range}
                    <XMarkIcon className="h-2 w-2" />
                  </Badge>
                ))
              )}
            </div>

            {/* Clear All Button - Only show if many filters */}
            {activeFiltersCount > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-destructive hover:text-destructive/80 h-6 py-0 px-2 flex-shrink-0"
              >
                Clear All
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};