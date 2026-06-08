import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MobileAuthFlow from './MobileAuthFlow';

/**
 * NativeAppWrapper - Handles the /auth route on native platforms after sign-out
 * or deep-link flows.
 *
 * Splash screen is intentionally NOT shown here — it is shown exactly once
 * during first launch by PlatformRoot (splash → onboarding → auth).
 * Showing it again here would replay the full-screen animation on every
 * sign-out, which is the green-screen bug this component previously caused.
 */
const NativeAppWrapper = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) {
    // Neutral placeholder while the navigate effect above fires
    return <div className="min-h-screen bg-background" />;
  }

  return <MobileAuthFlow skipSplash={true} />;
};

export default NativeAppWrapper;
