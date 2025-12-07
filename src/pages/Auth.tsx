import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/AuthPage";
import NativeAppWrapper from "@/components/mobile/NativeAppWrapper";
import { useAuth } from "@/hooks/useAuth";
import { isNativePlatform } from "@/utils/nativeStartup";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Use state-based platform detection (lazy loading safe)
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [platformChecked, setPlatformChecked] = useState(false);

  // Detect platform on mount (safe lazy loading)
  useEffect(() => {
    try {
      setIsMobileApp(isNativePlatform());
    } catch (error) {
      console.warn('[Auth] Platform detection failed:', error);
      setIsMobileApp(false);
    }
    setPlatformChecked(true);
  }, []);

  useEffect(() => {
    if (!loading && user && !isMobileApp) {
      // Only redirect for web users (native app handled by NativeAppWrapper)
      navigate("/");
    }
  }, [user, loading, navigate, isMobileApp]);

  // Show loading while checking platform or auth
  if (loading || !platformChecked) {
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