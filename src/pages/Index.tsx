import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedErrorBoundary } from "@/components/FeedErrorBoundary";
import { useMobileIcons } from "@/hooks/useMobileIcons";

// Lazy load components for better initial load
const HomeDashboard = lazy(() => import('@/components/HomeDashboard'));
const HomeWidgets = lazy(() => import('@/components/home/HomeWidgets'));

// Loading skeleton
const DashboardSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { shouldUseFilledIcons } = useMobileIcons();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['super_admin', 'moderator', 'manager', 'support', 'staff'])
          .maybeSingle();
        
        setUserRole(data?.role || null);
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    };
    
    checkUserRole();
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-16 lg:ml-64 pb-20 md:pb-0 pt-2 md:pt-0">
        {shouldUseFilledIcons ? (
          // Mobile: Show Overview widgets
          <Suspense fallback={<DashboardSkeleton />}>
            <HomeWidgets />
          </Suspense>
        ) : (
          // Desktop: Show Feed
          <div className="container px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
            <FeedErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <HomeDashboard />
              </Suspense>
            </FeedErrorBoundary>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
