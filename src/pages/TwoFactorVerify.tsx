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
      navigate('/auth');
    }
  }, [searchParams, navigate]);

  const handleSuccess = async () => {
    if (!userId) return;

    // Write server-side verification record. This is the authoritative signal —
    // Admin2FAGate and ProtectedRoute check this table, not sessionStorage.
    await supabase.from('user_2fa_sessions').upsert(
      { user_id: userId, verified_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

    sessionStorage.removeItem('pending2FA');

    navigate('/dashboard', { replace: true });
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