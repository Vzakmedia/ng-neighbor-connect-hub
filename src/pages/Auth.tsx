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
    if (!loading && user) {
      // Read the stored destination set by useDeepLinkHandler (or OTP flow).
      // Navigating directly to a ProtectedRoute from those flows causes a blank
      // green screen because React's auth state hasn't hydrated yet at that point.
      // Both flows navigate to /auth first, and we redirect here once user is set.
      const redirect = (() => { try { return sessionStorage.getItem('post_auth_redirect'); } catch { return null; } })();
      if (redirect) { try { sessionStorage.removeItem('post_auth_redirect'); } catch {} }
      navigate(redirect || '/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking platform or auth
  if (loading || !platformChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(162,85%,30%)]"></div>
      </div>
    );
  }

  // If the user is already authenticated, the redirect useEffect above will
  // navigate them to /dashboard (or the stored post_auth_redirect). Render a
  // plain background in the meantime — NEVER NativeAppWrapper, whose green
  // gradient loading state was the original "blank green screen" bug.
  if (user) {
    return <div className="min-h-screen bg-background" />;
  }

  // Use NativeAppWrapper for mobile app (handles splash + auth flow), regular auth page for web
  return isMobileApp ? <NativeAppWrapper /> : <AuthPage />;
};

export default Auth;