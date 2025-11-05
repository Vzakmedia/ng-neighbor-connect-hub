import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const FilterSection = ({
  title, 
  children, 
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className 
}: FilterSectionProps) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  
  // Use controlled state if provided, otherwise internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn("border-b border-border/50", className)}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 text-left hover:bg-accent/5 transition-colors px-1">
        <h3 className="text-base font-medium text-foreground">
          {title}
        </h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground transition-transform" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

FilterSection.displayName = "FilterSection";
