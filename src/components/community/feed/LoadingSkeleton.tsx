import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-card rounded-lg p-4 space-y-3 border border-border/50">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-muted" />
            <Skeleton className="h-3 w-24 bg-muted" />
          </div>
        </div>
        <Skeleton className="h-20 w-full bg-muted" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20 bg-muted" />
          <Skeleton className="h-8 w-20 bg-muted" />
          <Skeleton className="h-8 w-20 bg-muted" />
        </div>
      </div>
    ))}
  </div>
);
