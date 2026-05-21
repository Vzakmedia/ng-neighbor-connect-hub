import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from '@/lib/icons';
import { PasswordStrengthIndicator } from '@/components/security/PasswordStrengthIndicator';
import { validatePasswordStrength } from '@/utils/security';

export function SetPasswordForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  // A user is Google-only if they have no email identity (no password set yet)
  const isGoogleOnly = user?.identities
    ? !user.identities.some((id) => id.provider === 'email')
    : user?.app_metadata?.provider !== 'email';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    const { score } = validatePasswordStrength(newPassword);
    if (score < 3) {
      toast({ title: 'Password too weak', description: 'Please choose a stronger password.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // For email users, verify current password first by re-authenticating
      if (!isGoogleOnly) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email ?? '',
          password: currentPassword,
        });
        if (signInError) {
          toast({ title: 'Current password is incorrect', variant: 'destructive' });
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: isGoogleOnly ? 'Password set' : 'Password updated',
        description: isGoogleOnly
          ? 'You can now sign in with your email and this password.'
          : 'Your password has been updated successfully.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Failed to update password',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isGoogleOnly ? (
        <p className="text-sm text-muted-foreground">
          Your account uses Google sign-in. Set a password to also be able to sign in with your email ({user?.email}).
        </p>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowCurrent((v) => !v)}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="new-password">{isGoogleOnly ? 'Password' : 'New Password'}</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowNew((v) => !v)}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <PasswordStrengthIndicator password={newPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowConfirm((v) => !v)}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading
          ? 'Saving...'
          : isGoogleOnly
            ? 'Set Password'
            : 'Update Password'}
      </Button>
    </form>
  );
}
