import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import SafetyCenter from '@/components/SafetyCenter';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from "@/hooks/useAuth";
import { PageSkeleton, SafetyListSkeleton } from "@/components/skeletons";

const Safety = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <PageSkeleton><SafetyListSkeleton /></PageSkeleton>;
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-16 lg:ml-64 pb-16 md:pb-0">
        <div className="h-[calc(100vh-64px)]">
          <ErrorBoundary fallback={<ErrorState title="Safety center unavailable" description="Something went wrong loading the safety center." onRetry={() => window.location.reload()} />}>
            <SafetyCenter />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Safety;