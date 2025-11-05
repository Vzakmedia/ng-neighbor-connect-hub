import * as React from "react";
import { Button } from "@/components/ui/button";
import { PillFilter, PillOption } from "@/components/ui/pill-filter";
import { FilterSection } from "@/components/ui/filter-section";
import { cn } from "@/lib/utils";

export interface FilterGroup {
  id: string;
  title: string;
  options: PillOption[];
  defaultOpen?: boolean;
}

interface AdvancedFilterPanelProps {
  filterGroups: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (groupId: string, values: string[]) => void;
  onClear?: () => void;
  onHide?: () => void;
  className?: string;
  showActions?: boolean;
}

export const AdvancedFilterPanel = ({
  filterGroups,
  selectedFilters,
  onFilterChange,
  onClear,
  onHide,
  className,
  showActions = true,
}: AdvancedFilterPanelProps) => {
  // Count total active filters
  const activeFilterCount = Object.values(selectedFilters).reduce(
    (sum, filters) => sum + filters.length,
    0
  );

  return (
    <div className={cn("bg-background rounded-lg border shadow-sm", className)}>
      {/* Filter sections */}
      <div className="divide-y divide-border/50">
        {filterGroups.map((group) => (
          <FilterSection
            key={group.id}
            title={group.title}
            defaultOpen={group.defaultOpen}
          >
            <PillFilter
              options={group.options}
              value={selectedFilters[group.id] || []}
              onValueChange={(value) => 
                onFilterChange(group.id, Array.isArray(value) ? value : [value])
              }
              mode="multiple"
              className="px-1"
            />
          </FilterSection>
        ))}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          {onHide && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onHide}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Hide filters
            </Button>
          )}
          {onClear && activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground text-sm ml-auto"
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
