import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TwoFactorVerification } from '@/components/security/TwoFactorVerification';
import { supabase } from '@/integrations/supabase/client';

const TwoFactorVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const userIdParam = searchParams.get('userId');
    const pendingUserId = sessionStorage.getItem('pending2FA');

    if (userIdParam && pendingUserId === userIdParam) {
      setUserId(userIdParam);
    } else {
      // Redirect to login if no valid 2FA session
      navigate('/auth');
    }
  }, [searchParams, navigate]);

  const handleSuccess = async () => {
    if (!userId) return;

    // Clear pending 2FA session
    sessionStorage.removeItem('pending2FA');
    
    try {
      // Re-authenticate the user after successful 2FA
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
      }
      
      // Redirect to dashboard
      navigate('/');
    } catch (error) {
      console.error('Post-2FA authentication error:', error);
      navigate('/auth');
    }
  };

  const handleSkip = () => {
    sessionStorage.removeItem('pending2FA');
    navigate('/auth');
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TwoFactorVerification 
      userId={userId}
      onSuccess={handleSuccess}
      onSkip={handleSkip}
    />
  );
};

export default TwoFactorVerify;