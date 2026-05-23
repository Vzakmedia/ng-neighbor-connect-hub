import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className,
  size = 'sm',
}) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCircle2
            className={cn(
              sizeClasses[size],
              'text-[hsl(162_85%_30%)] fill-[hsl(162_85%_30%)] [&>path:first-child]:fill-white shrink-0',
              className
            )}
            aria-label="Verified member"
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs px-2 py-1">
          Verified member
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifiedBadge;
