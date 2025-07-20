import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/AuthPage";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <AuthPage />;
};

export default Auth;