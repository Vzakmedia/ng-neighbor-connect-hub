import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdvancedFilterPanel, FilterGroup } from "@/components/filters/AdvancedFilterPanel";
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

interface CommunityAdvancedFiltersProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  className?: string;
}

export const CommunityAdvancedFilters = ({
  filters,
  onFiltersChange,
  className,
}: CommunityAdvancedFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create filter groups organized by geopolitical zones
  const filterGroups: FilterGroup[] = [
    // Location by zones
    ...Object.entries(NIGERIAN_ZONES).map(([zone, states]) => ({
      id: `zone-${zone.toLowerCase().replace(/\s+/g, '-')}`,
      title: `📍 ${zone}`,
      options: states.map(state => ({ value: state, label: state })),
      defaultOpen: zone === "South West", // Default open for South West
    })),
    // Categories
    {
      id: "categories",
      title: "🏷️ Categories",
      options: POST_CATEGORIES.map(cat => ({ value: cat, label: cat })),
      defaultOpen: false,
    },
    // Date ranges
    {
      id: "dateRanges",
      title: "📅 Time Period",
      options: DATE_RANGES.map(range => ({ value: range, label: range })),
      defaultOpen: false,
    },
  ];

  // Map selectedFilters to the format expected by AdvancedFilterPanel
  const selectedFilters: Record<string, string[]> = {
    ...Object.keys(NIGERIAN_ZONES).reduce((acc, zone) => {
      const zoneId = `zone-${zone.toLowerCase().replace(/\s+/g, '-')}`;
      acc[zoneId] = filters.states.filter(state => 
        NIGERIAN_ZONES[zone as keyof typeof NIGERIAN_ZONES].includes(state)
      );
      return acc;
    }, {} as Record<string, string[]>),
    categories: filters.categories,
    dateRanges: filters.dateRanges,
  };

  const handleFilterChange = (groupId: string, values: string[]) => {
    if (groupId.startsWith('zone-')) {
      // Handle state selection
      const allZoneStates = Object.values(NIGERIAN_ZONES).flat();
      const otherStates = filters.states.filter(state => {
        // Get the zone this groupId belongs to
        const currentZone = Object.entries(NIGERIAN_ZONES).find(
          ([zone]) => `zone-${zone.toLowerCase().replace(/\s+/g, '-')}` === groupId
        );
        if (!currentZone) return true;
        return !currentZone[1].includes(state);
      });
      
      onFiltersChange({
        ...filters,
        states: [...otherStates, ...values],
      });
    } else if (groupId === 'categories') {
      onFiltersChange({
        ...filters,
        categories: values,
      });
    } else if (groupId === 'dateRanges') {
      onFiltersChange({
        ...filters,
        dateRanges: values,
      });
    }
  };

  const handleClear = () => {
    onFiltersChange({
      states: [],
      categories: [],
      dateRanges: [],
    });
  };

  const totalActiveFilters = 
    filters.states.length + 
    filters.categories.length + 
    filters.dateRanges.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full sm:w-auto gap-2 transition-all duration-200",
          isExpanded && "bg-accent/50"
        )}
      >
        <Filter className="h-4 w-4" />
        <span>Advanced Filters</span>
        {totalActiveFilters > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
            {totalActiveFilters}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 ml-auto" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-auto" />
        )}
      </Button>

      {/* Advanced Filter Panel */}
      {isExpanded && (
        <AdvancedFilterPanel
          filterGroups={filterGroups}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          onHide={() => setIsExpanded(false)}
          className="animate-in fade-in slide-in-from-top-2 duration-200"
        />
      )}

      {/* Active Filters Summary */}
      {totalActiveFilters > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {filters.states.length > 0 && (
            <span className="px-2 py-1 bg-accent/30 rounded-md">
              📍 {filters.states.length} state{filters.states.length !== 1 ? 's' : ''}
            </span>
          )}
          {filters.categories.length > 0 && (
            <span className="px-2 py-1 bg-accent/30 rounded-md">
              🏷️ {filters.categories.length} categor{filters.categories.length !== 1 ? 'ies' : 'y'}
            </span>
          )}
          {filters.dateRanges.length > 0 && (
            <span className="px-2 py-1 bg-accent/30 rounded-md">
              📅 {filters.dateRanges.length} period{filters.dateRanges.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
