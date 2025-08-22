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
    { value: 'neighborhood', label: 'Neighborhood', icon: MapPin },
    { value: 'city', label: 'City', icon: MapPin },
    { value: 'state', label: 'State', icon: MapPin },
    { value: 'all', label: 'All Areas', icon: MapPin }
  ];

  const postTypeOptions = [
    { value: 'events', label: 'Events', icon: Calendar },
    { value: 'general', label: 'General Posts', icon: Users },
    { value: 'all', label: 'All Types', icon: Users }
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
      {/* Filter Button and Active Filters in same line */}
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
            className="w-80 sm:w-96 p-0 max-h-[75vh] overflow-hidden bg-popover border shadow-lg z-50" 
            align="start"
          >
            <div className="flex flex-col h-full max-h-[75vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-popover sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm sm:text-base">Filters</h4>
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-muted-foreground hover:text-destructive h-6 sm:h-8 px-2"
                  >
                    <span className="hidden sm:inline">Reset All</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                )}
              </div>
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4">

                {/* Sort & Period */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-primary" />
                      Sort
                    </Label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
                    >
                      <SelectTrigger className="h-7 sm:h-8 bg-background/50 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {sortOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-primary" />
                      Period
                    </Label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
                    >
                      <SelectTrigger className="h-7 sm:h-8 bg-background/50 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {dateRangeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Content Types */}
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <Users className="h-3 w-3 text-primary" />
                    Content Types
                  </Label>
                  <div className="grid grid-cols-2 gap-1 sm:gap-2">
                    {postTypeOptions.map(type => (
                      <div 
                        key={type.value} 
                        className={`flex items-center space-x-1 sm:space-x-2 py-1 sm:py-2 px-1 sm:px-2 rounded-md border transition-all cursor-pointer hover:bg-accent/50 ${
                          filters.postTypes.includes(type.value) 
                            ? 'bg-primary/10 border-primary/50' 
                            : 'bg-background/50 border-border/50'
                        }`}
                        onClick={() => handlePostTypeToggle(type.value)}
                      >
                        <Checkbox
                          id={`post-type-${type.value}`}
                          checked={filters.postTypes.includes(type.value)}
                          onCheckedChange={() => handlePostTypeToggle(type.value)}
                          className="h-3 w-3"
                        />
                        <Label
                          htmlFor={`post-type-${type.value}`}
                          className="text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <type.icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{type.label}</span>
                          <span className="sm:hidden">{type.label.split(' ')[0]}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Range */}
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-primary" />
                    Location Range
                  </Label>
                  <div className="grid grid-cols-2 gap-1 sm:gap-2">
                    {locationScopeOptions.map(scope => (
                      <div 
                        key={scope.value} 
                        className={`flex items-center space-x-1 sm:space-x-2 py-1 sm:py-2 px-1 sm:px-2 rounded-md border transition-all cursor-pointer hover:bg-accent/50 ${
                          filters.locationScope.includes(scope.value) 
                            ? 'bg-primary/10 border-primary/50' 
                            : 'bg-background/50 border-border/50'
                        }`}
                        onClick={() => handleLocationScopeToggle(scope.value)}
                      >
                        <Checkbox
                          id={`location-${scope.value}`}
                          checked={filters.locationScope.includes(scope.value)}
                          onCheckedChange={() => handleLocationScopeToggle(scope.value)}
                          className="h-3 w-3"
                        />
                        <Label
                          htmlFor={`location-${scope.value}`}
                          className="text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <scope.icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{scope.label}</span>
                          <span className="sm:hidden">{scope.label.split(' ')[0]}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags Search */}
                {availableTags.length > 0 && (
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-2">
                      <Tag className="h-3 w-3 text-primary" />
                      Tags ({availableTags.length})
                    </Label>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2 top-1.5 sm:top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Search or add tags..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tagSearch.trim()) {
                            handleTagAdd(tagSearch);
                          }
                        }}
                        className="h-7 sm:h-8 pl-7 text-xs bg-background/50"
                      />
                    </div>

                    {/* Selected Tags */}
                    {filters.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {filters.tags.map(tag => (
                          <Badge
                            key={tag}
                            variant="default"
                            className="gap-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary border-primary/20"
                          >
                            #{tag.length > 6 ? tag.substring(0, 6) + '...' : tag}
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
                      <div className="max-h-20 sm:max-h-32 overflow-y-auto space-y-1 pr-1">
                        {filteredAvailableTags.slice(0, 6).map(tag => (
                          <div
                            key={tag}
                            onClick={() => handleTagAdd(tag)}
                            className="flex items-center space-x-2 p-1.5 rounded-sm border transition-all cursor-pointer hover:bg-accent/50 bg-background/30 border-border/30"
                          >
                            <Tag className="h-2 w-2" />
                            <span className="text-xs font-medium">#{tag}</span>
                          </div>
                        ))}
                        {filteredAvailableTags.length > 6 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            +{filteredAvailableTags.length - 6} more
                          </p>
                        )}
                      </div>
                    )}
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
                  <span className="sm:hidden">{scope}</span>
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
                  <span className="sm:hidden">{type}</span>
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