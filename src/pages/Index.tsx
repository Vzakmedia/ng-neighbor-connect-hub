import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import CommunityFeed from '@/components/CommunityFeed';
import { useAuth } from "@/hooks/useAuth";

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
      
      <main className="md:ml-64 pb-16 md:pb-0">
        <HeroSection />
        
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Community Updates</h2>
              <p className="text-muted-foreground">Stay connected with your neighborhood</p>
            </div>
            <CommunityFeed />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
