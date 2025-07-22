import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import HomeDashboard from '@/components/HomeDashboard';
import { useMinimalAuth as useAuth } from "@/hooks/useAuth-minimal";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
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
      
      <main className="md:ml-64 pb-20 md:pb-0 pt-2 md:pt-0">
        <div className="container px-4 md:px-6 py-3 md:py-6">
          <HomeDashboard />
        </div>
      </main>
    </div>
  );
};

export default Index;
