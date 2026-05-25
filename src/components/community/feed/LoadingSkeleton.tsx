import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const PostSkeleton = () => (
  <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
    {/* Author row */}
    <div className="flex items-center gap-3 p-4 pb-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    {/* Content lines */}
    <div className="px-4 pb-3 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    {/* Action row */}
    <div className="flex gap-2 px-4 pb-4 pt-1">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  </div>
);

export const LoadingSkeleton = () => (
  <div className="space-y-3 sm:space-y-4">
    {[1, 2, 3].map((i) => (
      <PostSkeleton key={i} />
    ))}
  </div>
);
