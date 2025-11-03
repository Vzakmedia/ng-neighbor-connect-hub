import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useBiometricAuth } from '@/hooks/mobile/useBiometricAuth';
import { useAuth } from '@/hooks/useAuth';
import { Fingerprint, Loader2 } from 'lucide-react';

export const BiometricSettings = () => {
  const { 
    isAvailable, 
    biometricName, 
    isLoading, 
    isNative,
    biometricEnabled,
    enableBiometric,
    disableBiometric,
  } = useBiometricAuth();
  const { user } = useAuth();

  if (!isNative || !isAvailable) {
    return null;
  }

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      // Get current session token (simplified - in production, handle this more securely)
      const { data } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      if (data.session?.access_token) {
        await enableBiometric(data.session.access_token);
      }
    } else {
      await disableBiometric();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          <CardTitle>Biometric Authentication</CardTitle>
        </div>
        <CardDescription>
          Use {biometricName} to quickly login to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="biometric-toggle" className="text-base">
              Enable {biometricName}
            </Label>
            <p className="text-sm text-muted-foreground">
              Login faster with {biometricName} instead of password
            </p>
          </div>
          <Switch
            id="biometric-toggle"
            checked={biometricEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        {biometricEnabled && (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Quick Login Enabled</p>
            <p className="text-xs text-muted-foreground">
              You can now use {biometricName} to login instead of entering your password.
              Your credentials are securely stored on your device.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggle(false)}
              disabled={isLoading}
              className="mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Disable'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
