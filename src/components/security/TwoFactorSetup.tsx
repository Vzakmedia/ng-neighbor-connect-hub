import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Smartphone, Copy, Download, AlertTriangle } from '@/lib/icons';
import QRCode from 'qrcode';
import { TOTP } from 'otpauth';

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      checkExisting2FA();
    }
  }, [user]);

  const checkExisting2FA = async () => {
    try {
      const { data, error } = await supabase
        .from('user_2fa')
        .select('is_enabled')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setIsEnabled(data.is_enabled);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const generateSecret = () => {
    const totp = new TOTP({
      issuer: 'NeighborNet',
      label: user?.email || 'User',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    
    const newSecret = totp.secret.base32;
    setSecret(newSecret);
    
    const otpUrl = totp.toString();
    QRCode.toDataURL(otpUrl)
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  };

  const verifyCode = async () => {
    if (!verificationCode || !secret) return;

    setIsLoading(true);
    try {
      // Verify TOTP code
      const totp = new TOTP({
        issuer: 'NeighborNet',
        label: user?.email || 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });

      const isValid = totp.validate({ token: verificationCode, window: 1 });
      
      if (isValid !== null) {
        // Generate backup codes
        const codes = Array.from({ length: 8 }, () => 
          Math.random().toString(36).substring(2, 10).toUpperCase()
        );
        setBackupCodes(codes);

        // Save to database
        const { error } = await supabase
          .from('user_2fa')
          .upsert({
            user_id: user?.id,
            secret: secret,
            is_enabled: true,
            backup_codes: codes,
            enabled_at: new Date().toISOString(),
          });

        if (error) throw error;

        setIsEnabled(true);
        setStep('backup');
        toast({
          title: "2FA Enabled Successfully",
          description: "Your account is now secured with two-factor authentication.",
        });
      } else {
        toast({
          title: "Invalid Code",
          description: "Please check your authenticator app and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast({
        title: "Setup Failed",
        description: "Unable to enable 2FA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_2fa')
        .update({ is_enabled: false })
        .eq('user_id', user?.id);

      if (error) throw error;

      setIsEnabled(false);
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
    } catch (error) {
      console.error('2FA disable error:', error);
      toast({
        title: "Error",
        description: "Unable to disable 2FA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    const { useNativeClipboard } = await import('@/hooks/mobile/useNativeClipboard');
    const { copyToClipboard } = useNativeClipboard();
    await copyToClipboard(backupCodes.join('\n'), "Backup codes copied to clipboard");
  };

  const downloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'neighbornet-backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isEnabled && step !== 'backup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Your account is protected with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Enabled
              </Badge>
              <span className="text-sm text-muted-foreground">
                Last used: Active
              </span>
            </div>
            <Button 
              variant="outline" 
              onClick={disable2FA}
              disabled={isLoading}
            >
              Disable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Two-Factor Authentication Setup
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'setup' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Step 1: Install an Authenticator App</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Download an authenticator app like Google Authenticator, Authy, or 1Password.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Step 2: Scan QR Code</h3>
              {!qrCodeUrl ? (
                <Button onClick={generateSecret}>
                  Generate QR Code
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="border rounded" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Or enter this code manually:
                    </p>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {secret}
                    </code>
                  </div>
                  <Button 
                    onClick={() => setStep('verify')} 
                    className="w-full"
                  >
                    Continue to Verification
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Step 3: Verify Setup</h3>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to verify the setup.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setStep('setup')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={verifyCode}
                disabled={verificationCode.length !== 6 || isLoading}
                className="flex-1"
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Save Your Backup Codes</h3>
                  <p className="text-sm text-yellow-700">
                    Store these codes in a safe place. Each code can only be used once to access your account if you lose your authenticator device.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Backup Codes</Label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-center py-1">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={copyBackupCodes} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            <Button 
              onClick={onComplete}
              className="w-full"
            >
              Complete Setup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};