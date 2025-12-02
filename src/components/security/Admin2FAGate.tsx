import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import { TwoFactorSetup } from './TwoFactorSetup';
import { TwoFactorVerification } from './TwoFactorVerification';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Admin2FAGateProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export const Admin2FAGate = ({ children, requireVerification = true }: Admin2FAGateProps) => {
  const { user } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState<number | null>(null);

  useEffect(() => {
    const check2FAStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if 2FA is enabled
        const { data: twoFAData } = await supabase
          .from('user_2fa')
          .select('is_enabled, created_at')
          .eq('user_id', user.id)
          .single();

        setIs2FAEnabled(twoFAData?.is_enabled || false);

        // Check admin role creation date for grace period
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('created_at')
          .eq('user_id', user.id)
          .in('role', ['admin', 'super_admin'])
          .single();

        if (roleData && !twoFAData?.is_enabled) {
          const roleCreatedAt = new Date(roleData.created_at);
          const now = new Date();
          const daysSinceRoleAssigned = Math.floor((now.getTime() - roleCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
          const gracePeriod = 7; // 7 days grace period
          
          if (daysSinceRoleAssigned < gracePeriod) {
            setGracePeriodDays(gracePeriod - daysSinceRoleAssigned);
          }
        }

        // If 2FA is not enabled, they can't be verified
        if (!twoFAData?.is_enabled) {
          setIsVerified(false);
        }

      } catch (error) {
        console.error('Error checking 2FA status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    check2FAStatus();
  }, [user]);

  const handleSetupComplete = () => {
    setIs2FAEnabled(true);
    setShowSetup(false);
    // After setup, require verification
    setIsVerified(false);
  };

  const handleVerificationSuccess = () => {
    setIsVerified(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If 2FA is not enabled
  if (!is2FAEnabled) {
    // Show grace period warning if applicable
    if (gracePeriodDays !== null && gracePeriodDays > 0) {
      return (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Two-Factor Authentication Required</AlertTitle>
            <AlertDescription>
              As an administrator, you must enable 2FA within {gracePeriodDays} day{gracePeriodDays > 1 ? 's' : ''}.
              After this period, access to admin features will be restricted.
            </AlertDescription>
          </Alert>

          {showSetup ? (
            <TwoFactorSetup onComplete={handleSetupComplete} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Enable Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Secure your admin account with 2FA to protect sensitive operations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowSetup(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Setup 2FA Now
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Still allow access during grace period */}
          {children}
        </div>
      );
    }

    // Grace period expired - block access
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              2FA Required
            </CardTitle>
            <CardDescription>
              Two-factor authentication is mandatory for administrator accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Your access to admin features has been restricted until you enable 2FA.
              </AlertDescription>
            </Alert>

            {showSetup ? (
              <TwoFactorSetup onComplete={handleSetupComplete} />
            ) : (
              <Button onClick={() => setShowSetup(true)} className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                Setup Two-Factor Authentication
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2FA is enabled but not verified in this session
  if (requireVerification && !isVerified) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verify Your Identity
            </CardTitle>
            <CardDescription>
              Enter your 2FA code to access admin features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TwoFactorVerification
              userId={user?.id || ''}
              onSuccess={handleVerificationSuccess}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed
  return <>{children}</>;
};
