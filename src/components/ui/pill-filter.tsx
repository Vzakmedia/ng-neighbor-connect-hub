import * as React from "react";
import { cn } from "@/lib/utils";

export interface PillOption {
  value: string;
  label: string;
}

interface PillFilterProps {
  options: PillOption[];
  value: string | string[]; // Single or multi-select
  onValueChange: (value: string | string[]) => void;
  mode?: "single" | "multiple"; // Single-select or multi-select
  className?: string;
  pillClassName?: string;
}

export const PillFilter = ({ 
  options, 
  value, 
  onValueChange, 
  mode = "multiple",
  className,
  pillClassName 
}: PillFilterProps) => {
  // Convert single value to array for consistent handling
  const selectedValues = Array.isArray(value) ? value : [value];

  const handleToggle = (toggleValue: string) => {
    if (mode === "single") {
      // Single-select mode: just set the value
      onValueChange(toggleValue);
    } else {
      // Multi-select mode: toggle in array
      if (selectedValues.includes(toggleValue)) {
        const newValues = selectedValues.filter(v => v !== toggleValue);
        onValueChange(newValues.length > 0 ? newValues : []);
      } else {
        onValueChange([...selectedValues, toggleValue]);
      }
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={cn(
              // Base styles
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "touch-manipulation min-w-[60px] text-center",
              // Selected state (black bg, white text)
              isSelected && "bg-black dark:bg-white text-white dark:text-black shadow-sm",
              // Unselected state (light gray bg)
              !isSelected && "bg-muted text-muted-foreground",
              // Hover states
              !isSelected && "hover:bg-muted/80",
              isSelected && "hover:bg-black/90 dark:hover:bg-white/90",
              pillClassName
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
