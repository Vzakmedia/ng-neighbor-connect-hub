import { useState } from "react";
import { Filter, X, Calendar, MapPin, Tag, Users, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFiltersChange({ ...filters, tags: newTags });
  };

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
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="default" 
              className="relative gap-2 bg-card/50 border-border/50 hover:bg-accent/50 hover:border-accent transition-all duration-200"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="default" 
                  className="ml-2 h-5 min-w-5 text-xs bg-primary/90 hover:bg-primary animate-pulse"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-lg">Filter Posts</h4>
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Reset All
                  </Button>
                )}
              </div>
              
              <Separator />

              {/* Quick Sort & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Sort By
                  </Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
                  >
                    <SelectTrigger className="h-10 bg-background/50">
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

                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Time Period
                  </Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
                  >
                    <SelectTrigger className="h-10 bg-background/50">
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

              <Separator />

              {/* Content Types */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Content Types
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {postTypeOptions.map(type => (
                    <div 
                      key={type.value} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent/50 ${
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
                      />
                      <Label
                        htmlFor={`post-type-${type.value}`}
                        className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Location Scope */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location Range
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {locationScopeOptions.map(scope => (
                    <div 
                      key={scope.value} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent/50 ${
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
                      />
                      <Label
                        htmlFor={`location-${scope.value}`}
                        className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <scope.icon className="h-4 w-4" />
                        {scope.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {availableTags.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      Popular Tags ({availableTags.length})
                    </Label>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {availableTags.slice(0, 12).map(tag => (
                        <div 
                          key={tag} 
                          className={`flex items-center space-x-3 p-2 rounded-md border transition-all cursor-pointer hover:bg-accent/50 ${
                            filters.tags.includes(tag) 
                              ? 'bg-primary/10 border-primary/50' 
                              : 'bg-background/30 border-border/30'
                          }`}
                          onClick={() => handleTagToggle(tag)}
                        >
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={filters.tags.includes(tag)}
                            onCheckedChange={() => handleTagToggle(tag)}
                          />
                          <Label
                            htmlFor={`tag-${tag}`}
                            className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Tag className="h-3 w-3" />
                            #{tag}
                          </Label>
                        </div>
                      ))}
                      {availableTags.length > 12 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{availableTags.length - 12} more tags available
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-destructive hover:text-destructive/80 h-auto py-1"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Tags */}
            {filters.tags.map(tag => (
              <Badge
                key={`tag-${tag}`}
                variant="default"
                className="gap-2 px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors animate-fade-in"
              >
                <Tag className="h-3 w-3" />
                #{tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-primary/20 text-primary hover:text-primary/80"
                  onClick={() => clearFilter('tags', tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {/* Location Scopes */}
            {filters.locationScope.map(scope => (
              <Badge
                key={`scope-${scope}`}
                variant="default"
                className="gap-2 px-3 py-1 bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30 transition-colors animate-fade-in"
              >
                <MapPin className="h-3 w-3" />
                {locationScopeOptions.find(opt => opt.value === scope)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-accent/30"
                  onClick={() => clearFilter('locationScope', scope)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {/* Post Types */}
            {filters.postTypes.map(type => (
              <Badge
                key={`type-${type}`}
                variant="default"
                className="gap-2 px-3 py-1 bg-secondary/50 text-secondary-foreground border-secondary/30 hover:bg-secondary/70 transition-colors animate-fade-in"
              >
                <Users className="h-3 w-3" />
                {postTypeOptions.find(opt => opt.value === type)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-secondary/70"
                  onClick={() => clearFilter('postTypes', type)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {/* Date Range */}
            {filters.dateRange !== 'all' && (
              <Badge 
                variant="default" 
                className="gap-2 px-3 py-1 bg-muted/50 text-muted-foreground border-muted/30 hover:bg-muted/70 transition-colors animate-fade-in"
              >
                <Calendar className="h-3 w-3" />
                {dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-muted/70"
                  onClick={() => clearFilter('dateRange')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};