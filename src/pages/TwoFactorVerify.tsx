import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TwoFactorVerification } from '@/components/security/TwoFactorVerification';

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

  const handleSuccess = () => {
    if (!userId) return;
    // The verify-2fa Edge Function already wrote the user_2fa_sessions row
    // using service role. Nothing more to do on the client.
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