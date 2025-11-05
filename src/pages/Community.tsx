import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import CommunityBoards from '@/components/CommunityBoards';
import PaymentStatusHandler from '@/components/PaymentStatusHandler';
import { AdDisplay } from '@/components/advertising/display/AdDisplay';
import { useAuth } from "@/hooks/useAuth";

const Community = () => {
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
      
      <main className="md:ml-16 lg:ml-64 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <PaymentStatusHandler />
          
          <div className="space-y-6">
            <AdDisplay placement="sidebar" maxAds={2} />
            <CommunityBoards />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;