import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { FeedErrorBoundary } from "@/components/FeedErrorBoundary";

const HomeDashboard = lazy(() => import('@/components/HomeDashboard'));

const DashboardSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

const Feed = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-16 lg:ml-64 pb-20 md:pb-0 pt-2 md:pt-0">
        <div className="container px-0 lg:px-6 py-3 sm:py-4 md:py-6">
          <FeedErrorBoundary>
            <Suspense fallback={<DashboardSkeleton />}>
              <HomeDashboard />
            </Suspense>
          </FeedErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Feed;
