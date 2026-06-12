import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { TwoFactorVerification } from '@/components/security/TwoFactorVerification';

const TwoFactorVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    // The verify-2fa Edge Function already wrote the user_2fa_sessions row.
    // The 2FA status query is cached (staleTime 5 min) — refetch it NOW or
    // ProtectedRoute reads the stale "verified: false" and bounces straight
    // back to this page.
    sessionStorage.removeItem('pending2FA');
    await queryClient.refetchQueries({ queryKey: ['2fa-status', userId] });
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