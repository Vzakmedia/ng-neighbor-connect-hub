import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { FeedErrorBoundary } from "@/components/FeedErrorBoundary";
import { PageSkeleton, FeedSkeleton } from "@/components/skeletons";
import { UnifiedFeed } from "@/components/home/UnifiedFeed";

const HomeDashboard = lazy(() => import('@/components/HomeDashboard'));

const Feed = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return <PageSkeleton><FeedSkeleton /></PageSkeleton>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Mobile: premium unified feed (widgets + posts interleaved)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <FeedErrorBoundary>
          <UnifiedFeed />
        </FeedErrorBoundary>
      </div>
    );
  }

  // Desktop: existing HomeDashboard with full sidebar + tabs
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="md:ml-16 lg:ml-64 pb-20 md:pb-0 pt-2 md:pt-0">
        <div className="container px-0 lg:px-6 pt-1 sm:pt-2 md:pt-3 pb-3 sm:pb-4 md:pb-6">
          <FeedErrorBoundary>
            <Suspense fallback={<FeedSkeleton />}>
              <HomeDashboard />
            </Suspense>
          </FeedErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Feed;
