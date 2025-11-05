import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import SafetyCenter from '@/components/SafetyCenter';
import { useAuth } from "@/hooks/useAuth";

const Safety = () => {
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
        <div className="h-[calc(100vh-64px)]">
          <SafetyCenter />
        </div>
      </main>
    </div>
  );
};

export default Safety;