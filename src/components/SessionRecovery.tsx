import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const SessionRecovery = () => {
  const [sessionExpired, setSessionExpired] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('SessionRecovery: Checking session...', {
          hasSession: !!session,
          error: error?.message,
          userId: session?.user?.id,
          expiresAt: session?.expires_at,
        });

        if (error) {
          console.error('SessionRecovery: Session error:', error);
          setSessionExpired(true);
          return;
        }

        if (!session) {
          console.warn('SessionRecovery: No session found');
          setSessionExpired(true);
          return;
        }

        // Check if token is expired
        if (session.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const now = Date.now();

          if (expiresAt < now) {
            console.warn('SessionRecovery: Session expired, attempting refresh...');
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !data.session) {
              console.error('SessionRecovery: Refresh failed:', refreshError);
              setSessionExpired(true);
              toast({
                title: "Session Expired",
                description: "Please log in again to continue.",
                variant: "destructive",
              });
            } else {
              console.log('SessionRecovery: Session refreshed successfully');
              setSessionExpired(false);
            }
          }
        }
      } catch (error) {
        console.error('SessionRecovery: Unexpected error:', error);
        setSessionExpired(true);
      }
    };

    // Check immediately
    checkSession();

    // Check every minute
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [toast]);

  const handleRelogin = () => {
    // Clear all auth storage
    localStorage.removeItem('neighborlink-auth');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        localStorage.removeItem(key);
      }
    });
    
    // Redirect to auth page
    window.location.href = '/auth';
  };

  if (!sessionExpired) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>Your session has expired. Please log in again.</span>
          <Button onClick={handleRelogin} variant="outline" size="sm">
            Log In
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
