import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Smartphone, Key } from 'lucide-react';
import { TOTP } from 'otpauth';

interface TwoFactorVerificationProps {
  userId: string;
  onSuccess: () => void;
  onSkip?: () => void;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  userId,
  onSuccess,
  onSkip
}) => {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verify2FA = async () => {
    if ((!verificationCode && !useBackupCode) || (!backupCode && useBackupCode)) return;

    setIsLoading(true);
    try {
      if (useBackupCode) {
        // Verify backup code
        const { data, error } = await supabase.rpc('verify_backup_code', {
          _user_id: userId,
          _backup_code: backupCode
        });

        if (error) throw error;

        if (data) {
          // Log attempt
          await supabase.rpc('log_2fa_attempt', {
            _user_id: userId,
            _attempt_type: 'backup_code',
            _success: true
          });

          toast({
            title: "Backup Code Verified",
            description: "Successfully verified using backup code.",
          });
          onSuccess();
        } else {
          await supabase.rpc('log_2fa_attempt', {
            _user_id: userId,
            _attempt_type: 'backup_code',
            _success: false
          });

          toast({
            title: "Invalid Backup Code",
            description: "The backup code is invalid or has already been used.",
            variant: "destructive",
          });
        }
      } else {
        // Get user's 2FA secret
        const { data: user2fa, error: fetchError } = await supabase
          .from('user_2fa')
          .select('secret')
          .eq('user_id', userId)
          .eq('is_enabled', true)
          .single();

        if (fetchError || !user2fa) {
          throw new Error('2FA not properly configured');
        }

        // Verify TOTP code
        const totp = new TOTP({
          secret: user2fa.secret,
        });

        const isValid = totp.validate({ token: verificationCode, window: 1 });

        if (isValid !== null) {
          // Update last used
          await supabase
            .from('user_2fa')
            .update({ last_used_at: new Date().toISOString() })
            .eq('user_id', userId);

          // Log attempt
          await supabase.rpc('log_2fa_attempt', {
            _user_id: userId,
            _attempt_type: 'totp',
            _success: true
          });

          toast({
            title: "2FA Verified",
            description: "Successfully verified two-factor authentication.",
          });
          onSuccess();
        } else {
          await supabase.rpc('log_2fa_attempt', {
            _user_id: userId,
            _attempt_type: 'totp',
            _success: false
          });

          toast({
            title: "Invalid Code",
            description: "Please check your authenticator app and try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast({
        title: "Verification Failed",
        description: "Unable to verify 2FA code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the verification code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!useBackupCode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Authenticator Code
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-wider"
                />
              </div>
              
              <Button
                onClick={verify2FA}
                disabled={verificationCode.length !== 6 || isLoading}
                className="w-full"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUseBackupCode(true)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Use backup code instead
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-code" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Backup Code
                </Label>
                <Input
                  id="backup-code"
                  type="text"
                  placeholder="Enter backup code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  className="text-center text-lg tracking-wider"
                />
              </div>
              
              <Button
                onClick={verify2FA}
                disabled={!backupCode || isLoading}
                className="w-full"
              >
                {isLoading ? "Verifying..." : "Use Backup Code"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(false);
                    setBackupCode('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Use authenticator app instead
                </button>
              </div>
            </div>
          )}

          {onSkip && (
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                onClick={onSkip}
                className="w-full text-muted-foreground"
              >
                Skip for now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};