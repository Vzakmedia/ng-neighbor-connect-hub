import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useAuth } from "@/hooks/useAuth";
import { useMobileIcons } from "@/hooks/useMobileIcons";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedErrorBoundary } from "@/components/FeedErrorBoundary";

// Lazy load the dashboard for better initial load
const HomeDashboard = lazy(() => import('@/components/HomeDashboard'));

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
  const { shouldUseFilledIcons } = useMobileIcons();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Redirect mobile/native users to /home
  if (shouldUseFilledIcons && !loading) {
    return <Navigate to="/home" replace />;
  }

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
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

  // Always show the regular dashboard - staff can access staff portal via navigation

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-16 lg:ml-64 pb-20 md:pb-0 pt-2 md:pt-0">
        <div className="container px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
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

export default Index;
