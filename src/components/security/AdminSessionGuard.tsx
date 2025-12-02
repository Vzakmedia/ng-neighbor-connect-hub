import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminSessionGuardProps {
  children: React.ReactNode;
  onSessionStart?: () => void;
}

interface SecuritySettings {
  allowed_ips: string[];
  session_confirmed: boolean;
  max_session_duration_hours: number;
  require_reauth_minutes: number;
}

export const AdminSessionGuard = ({ children, onSessionStart }: AdminSessionGuardProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [requiresReauth, setRequiresReauth] = useState(false);
  const [password, setPassword] = useState('');
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  const checkSessionSecurity = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Get security settings for this admin
      const { data: securityData } = await supabase
        .from('super_admin_security')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const settings: SecuritySettings = {
        allowed_ips: securityData?.allowed_ips || [],
        session_confirmed: securityData?.session_confirmed || false,
        max_session_duration_hours: securityData?.max_session_duration_hours || 8,
        require_reauth_minutes: securityData?.require_reauth_minutes || 30
      };

      // Check session duration
      const sessionStart = sessionStorage.getItem('admin_session_start');
      if (sessionStart) {
        const sessionStartTime = new Date(sessionStart);
        const now = new Date();
        const sessionDurationHours = (now.getTime() - sessionStartTime.getTime()) / (1000 * 60 * 60);

        if (sessionDurationHours > settings.max_session_duration_hours) {
          setSessionWarning('Session expired. Please re-authenticate.');
          setRequiresReauth(true);
          setIsValidSession(false);
          setIsLoading(false);
          return;
        }

        // Check if re-authentication is needed
        const lastActivity = sessionStorage.getItem('admin_last_activity');
        if (lastActivity) {
          const lastActivityTime = new Date(lastActivity);
          const inactiveMinutes = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60);

          if (inactiveMinutes > settings.require_reauth_minutes) {
            setSessionWarning('Session inactive. Please re-authenticate.');
            setRequiresReauth(true);
            setIsValidSession(false);
            setIsLoading(false);
            return;
          }
        }
      } else {
        // Start new session
        sessionStorage.setItem('admin_session_start', new Date().toISOString());
      }

      // Update last activity
      sessionStorage.setItem('admin_last_activity', new Date().toISOString());

      // Log session check
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action_type: 'admin_session_check',
          resource_type: 'admin_session',
          details: {
            timestamp: new Date().toISOString(),
            valid: true
          }
        });

      setIsValidSession(true);
      onSessionStart?.();

    } catch (error) {
      console.error('Error checking session security:', error);
      setSessionWarning('Security check failed. Please try again.');
      setIsValidSession(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, onSessionStart]);

  useEffect(() => {
    checkSessionSecurity();

    // Set up activity tracking
    const updateActivity = () => {
      sessionStorage.setItem('admin_last_activity', new Date().toISOString());
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [checkSessionSecurity]);

  const handleReauthenticate = async () => {
    if (!user?.email || !password) return;

    setIsReauthenticating(true);
    try {
      // Attempt to sign in with current credentials
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });

      if (error) {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid password. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Reset session
      sessionStorage.setItem('admin_session_start', new Date().toISOString());
      sessionStorage.setItem('admin_last_activity', new Date().toISOString());

      // Log re-authentication
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action_type: 'admin_reauth_success',
          resource_type: 'admin_session',
          details: {
            timestamp: new Date().toISOString()
          }
        });

      setRequiresReauth(false);
      setSessionWarning(null);
      setPassword('');
      setIsValidSession(true);

      toast({
        title: 'Re-authenticated',
        description: 'Your session has been renewed.'
      });

    } catch (error) {
      console.error('Re-authentication error:', error);
      toast({
        title: 'Error',
        description: 'Re-authentication failed. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsReauthenticating(false);
    }
  };

  const handleForceLogout = async () => {
    sessionStorage.removeItem('admin_session_start');
    sessionStorage.removeItem('admin_last_activity');
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verifying session security...</p>
        </div>
      </div>
    );
  }

  if (requiresReauth) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Expired
            </CardTitle>
            <CardDescription>
              {sessionWarning || 'Please re-authenticate to continue.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReauthenticate()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReauthenticate}
                disabled={!password || isReauthenticating}
                className="flex-1"
              >
                {isReauthenticating ? 'Verifying...' : 'Re-authenticate'}
              </Button>
              <Button variant="outline" onClick={handleForceLogout}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Session Invalid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {sessionWarning || 'Your session could not be validated.'}
              </AlertDescription>
            </Alert>
            <Button onClick={handleForceLogout} className="w-full">
              Sign Out and Re-login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
