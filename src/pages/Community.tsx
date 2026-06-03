import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import CommunityBoards from '@/components/CommunityBoards';
import PaymentStatusHandler from '@/components/PaymentStatusHandler';
import { useAuth } from "@/hooks/useAuth";
import { PageSkeleton, FeedSkeleton } from "@/components/skeletons";

const Community = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <PageSkeleton><FeedSkeleton /></PageSkeleton>;
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
          
          <CommunityBoards />
        </div>
      </main>
    </div>
  );
};

export default Community;