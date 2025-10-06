import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/hooks/useAuth';
import Landing from '@/pages/Landing';

/**
 * PlatformRoot - Smart root route handler
 * 
 * Detects platform and authentication status to route users appropriately:
 * 
 * Native App (Capacitor):
 * - Authenticated → /dashboard
 * - Not Authenticated → /auth (shows NativeAppWrapper with splash + onboarding)
 * 
 * Web Browser:
 * - Shows Landing page (marketing content)
 */
const PlatformRoot = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isNativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    if (loading) return;

    // Native app logic
    if (isNativeApp) {
      if (user) {
        // Authenticated user → go to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // Not authenticated → go to auth flow (splash + onboarding + auth)
        navigate('/auth', { replace: true });
      }
    }
    // For web, we'll render the Landing component below
  }, [isNativeApp, user, loading, navigate]);

  // Show loading spinner during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // For native apps, we'll navigate in the useEffect above
  // This will only render for web browsers
  if (isNativeApp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Web browser: show landing page
  return <Landing />;
};

export default PlatformRoot;
