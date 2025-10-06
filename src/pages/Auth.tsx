import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/AuthPage";
import NativeAppWrapper from "@/components/mobile/NativeAppWrapper";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from '@capacitor/core';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Check if running in mobile app (Capacitor) vs web browser
  const isMobileApp = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!loading && user && !isMobileApp) {
      // Only redirect for web users (native app handled by NativeAppWrapper)
      navigate("/");
    }
  }, [user, loading, navigate, isMobileApp]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(162,85%,30%)]"></div>
      </div>
    );
  }

  // Use NativeAppWrapper for mobile app (handles splash + auth flow), regular auth page for web
  return isMobileApp ? <NativeAppWrapper /> : <AuthPage />;
};

export default Auth;