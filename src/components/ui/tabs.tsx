import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { useMobileIcons } from "@/hooks/useMobileIcons"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex items-center border-b border-border overflow-x-auto scrollbar-hide scroll-smooth",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    icon?: React.ComponentType<any>;
    iconSolid?: React.ComponentType<any>;
  }
>(({ className, icon, iconSolid, children, ...props }, ref) => {
  const { shouldUseFilledIcons } = useMobileIcons();
  const isActive = props.value === props['data-state'];
  
  // Select icon: use solid on mobile/native when active
  const IconComponent = (isActive && shouldUseFilledIcons && iconSolid) 
    ? iconSolid 
    : icon;
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 shrink-0",
        "data-[state=active]:text-foreground data-[state=active]:font-semibold",
        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-primary after:transition-opacity",
        "after:opacity-0 data-[state=active]:after:opacity-100",
        className
      )}
      {...props}
    >
      {IconComponent && <IconComponent className="h-4 w-4" />}
      {children}
    </TabsPrimitive.Trigger>
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
