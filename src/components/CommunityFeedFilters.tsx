import { useState } from "react";
import { Filter, X, Calendar, MapPin, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
    <div className="space-y-3">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
                >
                  <SelectTrigger className="h-8">
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

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date Range</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
                >
                  <SelectTrigger className="h-8">
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

              {/* Post Types */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Post Types</Label>
                <div className="space-y-2">
                  {postTypeOptions.map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`post-type-${type.value}`}
                        checked={filters.postTypes.includes(type.value)}
                        onCheckedChange={() => handlePostTypeToggle(type.value)}
                      />
                      <Label
                        htmlFor={`post-type-${type.value}`}
                        className="text-sm font-normal flex items-center gap-2"
                      >
                        <type.icon className="h-3 w-3" />
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Scope */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Location Scope</Label>
                <div className="space-y-2">
                  {locationScopeOptions.map(scope => (
                    <div key={scope.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${scope.value}`}
                        checked={filters.locationScope.includes(scope.value)}
                        onCheckedChange={() => handleLocationScopeToggle(scope.value)}
                      />
                      <Label
                        htmlFor={`location-${scope.value}`}
                        className="text-sm font-normal flex items-center gap-2"
                      >
                        <scope.icon className="h-3 w-3" />
                        {scope.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {availableTags.slice(0, 10).map(tag => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={filters.tags.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                        />
                        <Label
                          htmlFor={`tag-${tag}`}
                          className="text-sm font-normal flex items-center gap-2"
                        >
                          <Tag className="h-3 w-3" />
                          #{tag}
                        </Label>
                      </div>
                    ))}
                    {availableTags.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        +{availableTags.length - 10} more tags available
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Tags */}
          {filters.tags.map(tag => (
            <Badge
              key={`tag-${tag}`}
              variant="secondary"
              className="gap-1 animate-fade-in"
            >
              <Tag className="h-3 w-3" />
              #{tag}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
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
              variant="secondary"
              className="gap-1 animate-fade-in"
            >
              <MapPin className="h-3 w-3" />
              {locationScopeOptions.find(opt => opt.value === scope)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
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
              variant="secondary"
              className="gap-1 animate-fade-in"
            >
              <Users className="h-3 w-3" />
              {postTypeOptions.find(opt => opt.value === type)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => clearFilter('postTypes', type)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {/* Date Range */}
          {filters.dateRange !== 'all' && (
            <Badge variant="secondary" className="gap-1 animate-fade-in">
              <Calendar className="h-3 w-3" />
              {dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => clearFilter('dateRange')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};