import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/AuthPage";
import MobileAuthFlow from "@/components/mobile/MobileAuthFlow";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from '@capacitor/core';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Check if running in mobile app (Capacitor) vs web browser
  const isMobileApp = Capacitor.isNativePlatform();

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

  // Use mobile flow only for mobile app (Capacitor), regular auth page for web
  return isMobileApp ? <MobileAuthFlow /> : <AuthPage />;
};

export default Auth;