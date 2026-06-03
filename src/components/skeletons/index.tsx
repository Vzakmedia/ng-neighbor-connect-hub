import { Skeleton } from '@/components/ui/skeleton';

/* ─────────────────────────────────────────────────────────────
   Shared building blocks
───────────────────────────────────────────────────────────── */

/** Mimics the top Header bar */
const HeaderSkeleton = () => (
  <div className="h-14 border-b bg-background flex items-center px-4 gap-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <Skeleton className="h-5 w-32" />
    <div className="ml-auto flex gap-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

/** Mimics the left-sidebar Navigation on desktop */
const NavSkeleton = () => (
  <div className="hidden md:flex flex-col gap-3 p-3 w-16 lg:w-64 border-r min-h-screen">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="flex items-center gap-3 px-1">
        <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
        <Skeleton className="hidden lg:block h-4 w-24" />
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   PageSkeleton – replaces the auth-guard spinners.
   Shows the full shell (Header + Nav) so there's no layout jump.
───────────────────────────────────────────────────────────── */

interface PageSkeletonProps {
  /** Override the content area with a specific skeleton */
  children?: React.ReactNode;
}

export const PageSkeleton = ({ children }: PageSkeletonProps) => (
  <div className="min-h-screen bg-background flex flex-col">
    <HeaderSkeleton />
    <div className="flex flex-1">
      <NavSkeleton />
      <main className="flex-1 p-4 md:p-6 space-y-4">
        {children ?? <GenericContentSkeleton />}
      </main>
    </div>
  </div>
);

const GenericContentSkeleton = () => (
  <>
    <Skeleton className="h-8 w-48 mb-6" />
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-card rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    ))}
  </>
);

/* ─────────────────────────────────────────────────────────────
   Feed / Community post cards
───────────────────────────────────────────────────────────── */

export const PostCardSkeleton = () => (
  <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
    <div className="flex items-center gap-3 p-4 pb-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="px-4 pb-3 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="flex gap-2 px-4 pb-4 pt-1">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  </div>
);

export const FeedSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3 max-w-2xl mx-auto px-2 sm:px-4">
    {Array.from({ length: count }).map((_, i) => (
      <PostCardSkeleton key={i} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   PostDetail page
───────────────────────────────────────────────────────────── */

export const PostDetailSkeleton = () => (
  <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
    {/* Back button */}
    <Skeleton className="h-9 w-24 rounded-md" />
    {/* Post card */}
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
    {/* Comments */}
    <div className="space-y-3">
      <Skeleton className="h-5 w-24" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Marketplace / Services / Goods cards
───────────────────────────────────────────────────────────── */

export const MarketplaceCardSkeleton = () => (
  <div className="bg-card rounded-xl border overflow-hidden">
    <Skeleton className="h-40 w-full rounded-none" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  </div>
);

export const MarketplaceGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <MarketplaceCardSkeleton key={i} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Recommendation cards
───────────────────────────────────────────────────────────── */

export const RecommendationCardSkeleton = () => (
  <div className="bg-card rounded-xl border overflow-hidden">
    <Skeleton className="h-36 w-full rounded-none" />
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-4 w-4 rounded-sm" />
        ))}
      </div>
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </div>
);

export const RecommendationGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <RecommendationCardSkeleton key={i} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Events
───────────────────────────────────────────────────────────── */

export const EventCardSkeleton = () => (
  <div className="bg-card rounded-xl border p-4 space-y-3">
    <div className="flex gap-4">
      <div className="flex-shrink-0 text-center space-y-0.5">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-8 w-10" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
    </div>
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  </div>
);

export const EventListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <EventCardSkeleton key={i} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Profile page
───────────────────────────────────────────────────────────── */

export const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
    {/* Cover + avatar */}
    <div className="relative">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-20 w-20 rounded-full absolute -bottom-6 left-4 border-4 border-background" />
    </div>
    {/* Name / bio */}
    <div className="pt-8 space-y-2">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
    {/* Stats row */}
    <div className="flex gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="text-center space-y-1">
          <Skeleton className="h-6 w-10 mx-auto" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
    {/* Posts */}
    <div className="space-y-3">
      {[1, 2].map(i => <PostCardSkeleton key={i} />)}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   User Directory
───────────────────────────────────────────────────────────── */

export const UserCardSkeleton = () => (
  <div className="bg-card rounded-xl border p-4 flex items-center gap-4">
    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-8 w-20 rounded-md flex-shrink-0" />
  </div>
);

export const UserDirectorySkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <UserCardSkeleton key={i} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Blog
───────────────────────────────────────────────────────────── */

export const BlogCardSkeleton = () => (
  <div className="bg-card rounded-xl border overflow-hidden">
    <Skeleton className="h-44 w-full rounded-none" />
    <div className="p-5 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  </div>
);

export const BlogGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <BlogCardSkeleton key={i} />
    ))}
  </div>
);

export const BlogPostDetailSkeleton = () => (
  <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
    <Skeleton className="h-8 w-3/4" />
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24 ml-2" />
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Safety page – alert/report cards
───────────────────────────────────────────────────────────── */

export const SafetyCardSkeleton = () => (
  <div className="bg-card rounded-xl border p-4 space-y-3">
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="flex gap-2">
      <Skeleton className="h-7 w-20 rounded-md" />
      <Skeleton className="h-7 w-20 rounded-md" />
    </div>
  </div>
);

export const SafetyListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SafetyCardSkeleton key={i} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Settings / Privacy – form skeleton
───────────────────────────────────────────────────────────── */

export const SettingsSkeleton = () => (
  <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
    <Skeleton className="h-8 w-40" />
    {[1, 2, 3].map(section => (
      <div key={section} className="bg-card rounded-xl border p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3].map(row => (
          <div key={row} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   My Goods / My Services / My Bookings list
───────────────────────────────────────────────────────────── */

export const MyItemSkeleton = () => (
  <div className="bg-card rounded-xl border p-4 flex gap-4 items-start">
    <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  </div>
);

export const MyItemsListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <MyItemSkeleton key={i} />
    ))}
  </div>
);
