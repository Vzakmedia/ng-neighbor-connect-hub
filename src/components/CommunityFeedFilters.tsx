import { useState } from "react";
import { Filter, X, Calendar, MapPin, Tag, Users, SlidersHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export interface CommunityFilters {
  tags: string[];
  locationScope: string[];
  postTypes: string[];
  dateRange: string;
  sortBy: string;
}

interface CommunityFeedFiltersProps {
  filters: CommunityFilters;
  onFiltersChange: (filters: CommunityFilters) => void;
  availableTags: string[];
  activeFiltersCount: number;
}

export const CommunityFeedFilters = ({
  filters,
  onFiltersChange,
  availableTags,
  activeFiltersCount
}: CommunityFeedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const locationScopeOptions = [
    { value: 'neighborhood', label: 'Neighborhood', shortLabel: 'Near', icon: MapPin },
    { value: 'city', label: 'City', shortLabel: 'City', icon: MapPin },
    { value: 'state', label: 'State', shortLabel: 'State', icon: MapPin },
    { value: 'all', label: 'All Areas', shortLabel: 'All', icon: MapPin }
  ];

  const postTypeOptions = [
    { value: 'events', label: 'Events', shortLabel: 'Events', icon: Calendar },
    { value: 'general', label: 'General Posts', shortLabel: 'Posts', icon: Users },
    { value: 'all', label: 'All Types', shortLabel: 'All', icon: Users }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
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

  const handleLocationScopeToggle = (scope: string) => {
    const newScopes = filters.locationScope.includes(scope)
      ? filters.locationScope.filter(s => s !== scope)
      : [...filters.locationScope, scope];
    
    onFiltersChange({ ...filters, locationScope: newScopes });
  };

  const handlePostTypeToggle = (type: string) => {
    const newTypes = filters.postTypes.includes(type)
      ? filters.postTypes.filter(t => t !== type)
      : [...filters.postTypes, type];
    
    onFiltersChange({ ...filters, postTypes: newTypes });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      tags: [],
      locationScope: [],
      postTypes: [],
      dateRange: 'all',
      sortBy: 'newest'
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
        if (value) {
          onFiltersChange({ 
            ...filters, 
            locationScope: filters.locationScope.filter(s => s !== value) 
          });
        }
        break;
      case 'postTypes':
        if (value) {
          onFiltersChange({ 
            ...filters, 
            postTypes: filters.postTypes.filter(t => t !== value) 
          });
        }
        break;
      case 'dateRange':
        onFiltersChange({ ...filters, dateRange: 'all' });
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter Button and Active Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="relative gap-2 bg-card/50 border-border/50 hover:bg-accent/50 hover:border-accent transition-all duration-200"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="default" 
                  className="ml-1 h-5 min-w-5 text-xs bg-primary/90 hover:bg-primary animate-pulse"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-full max-w-sm sm:w-80 p-0 bg-popover border shadow-lg z-50" 
            align="start"
          >
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">Filters</h4>
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-muted-foreground hover:text-destructive h-6 px-2"
                  >
                    Reset
                  </Button>
                )}
              </div>
              
              {/* Sort & Period - Mobile responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Sort</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
                  >
                    <SelectTrigger className="h-8 sm:h-7 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {sortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs h-7">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Period</Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
                  >
                    <SelectTrigger className="h-8 sm:h-7 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {dateRangeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs h-7">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content Types - Mobile Button Layout */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Content Types
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {postTypeOptions.map(type => (
                    <Button
                      key={type.value}
                      variant={filters.postTypes.includes(type.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePostTypeToggle(type.value)}
                      className={`h-8 px-2 text-xs justify-start transition-all ${
                        filters.postTypes.includes(type.value) 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'bg-background hover:bg-accent hover:scale-[1.02]'
                      }`}
                    >
                      <type.icon className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate hidden sm:inline">{type.label}</span>
                      <span className="truncate sm:hidden">{type.shortLabel}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location Scope - Mobile Button Layout */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location Range
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {locationScopeOptions.map(scope => (
                    <Button
                      key={scope.value}
                      variant={filters.locationScope.includes(scope.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLocationScopeToggle(scope.value)}
                      className={`h-8 px-2 text-xs justify-center transition-all ${
                        filters.locationScope.includes(scope.value) 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'bg-background hover:bg-accent hover:scale-[1.02]'
                      }`}
                    >
                      <scope.icon className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate hidden sm:inline">{scope.label}</span>
                      <span className="truncate sm:hidden">{scope.shortLabel}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tags Search */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Tags
                </Label>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search or add tags..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagSearch.trim()) {
                        handleTagAdd(tagSearch);
                      }
                    }}
                    className="h-8 pl-7 text-xs bg-background"
                  />
                </div>

                {/* Selected Tags */}
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {filters.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="default"
                        className="gap-1 px-2 py-1 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        #{tag}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1 hover:bg-primary/20 text-primary"
                          onClick={() => handleTagRemove(tag)}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Available Tags Suggestions */}
                {tagSearch && filteredAvailableTags.length > 0 && (
                  <div className="max-h-20 overflow-y-auto space-y-0.5 border rounded p-1 bg-muted/20">
                    {filteredAvailableTags.slice(0, 4).map(tag => (
                      <div
                        key={tag}
                        onClick={() => handleTagAdd(tag)}
                        className="text-xs p-1.5 hover:bg-accent/50 rounded cursor-pointer transition-colors"
                      >
                        #{tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

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
                  <Tag className="h-2 w-2" />
                  #{tag.length > 6 ? tag.substring(0, 6) + '...' : tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-primary/20 text-primary hover:text-primary/80"
                    onClick={() => clearFilter('tags', tag)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}

              {/* Location Scopes */}
              {filters.locationScope.map(scope => (
                <Badge
                  key={`scope-${scope}`}
                  variant="default"
                  className="gap-1 px-2 py-0.5 text-xs bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30 transition-colors"
                >
                  <MapPin className="h-2 w-2" />
                  <span className="hidden sm:inline">{locationScopeOptions.find(opt => opt.value === scope)?.label}</span>
                  <span className="sm:hidden">{locationScopeOptions.find(opt => opt.value === scope)?.shortLabel}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-accent/30"
                    onClick={() => clearFilter('locationScope', scope)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}

              {/* Post Types */}
              {filters.postTypes.map(type => (
                <Badge
                  key={`type-${type}`}
                  variant="default"
                  className="gap-1 px-2 py-0.5 text-xs bg-secondary/50 text-secondary-foreground border-secondary/30 hover:bg-secondary/70 transition-colors"
                >
                  <Users className="h-2 w-2" />
                  <span className="hidden sm:inline">{postTypeOptions.find(opt => opt.value === type)?.label}</span>
                  <span className="sm:hidden">{postTypeOptions.find(opt => opt.value === type)?.shortLabel}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-secondary/70"
                    onClick={() => clearFilter('postTypes', type)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}

              {/* Date Range */}
              {filters.dateRange !== 'all' && (
                <Badge 
                  variant="default" 
                  className="gap-1 px-2 py-0.5 text-xs bg-muted/50 text-muted-foreground border-muted/30 hover:bg-muted/70 transition-colors"
                >
                  <Calendar className="h-2 w-2" />
                  <span className="hidden sm:inline">{dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}</span>
                  <span className="sm:hidden">{filters.dateRange}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-muted/70"
                    onClick={() => clearFilter('dateRange')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
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