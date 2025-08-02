import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModernLandingPage from "@/components/ModernLandingPage";
import { useAuth } from "@/hooks/useAuth";

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <ModernLandingPage />;
};

export default Landing;