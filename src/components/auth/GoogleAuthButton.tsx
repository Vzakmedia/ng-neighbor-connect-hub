import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { isNativePlatform } from "@/utils/platform";

interface GoogleAuthButtonProps {
  mode: 'signin' | 'signup';
  locationData?: {
    state: string;
    city: string;
    neighborhood: string;
    address: string;
  };
}

export const GoogleAuthButton = ({ mode, locationData }: GoogleAuthButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    const isNative = isNativePlatform();

    console.log('[GoogleAuth] Starting OAuth flow, mode:', mode, 'native:', isNative);

    try {
      if (isNative) {
        // Bug 3 fix: Do NOT register an appUrlOpen listener here.
        // useDeepLinkHandler (mounted globally in App.tsx) is the single handler
        // for all deep links, including OAuth callbacks. Registering a second
        // listener here caused duplicate session-set calls and double navigation.
        //
        // Bug 9 fix: Listen for the browser closing so we can reset the loading
        // state if the user dismisses the OAuth flow without completing it.
        const { Browser } = await import('@capacitor/browser');

        // Bug 4 / native: redirect back to the app's custom scheme so the deep
        // link handler picks up the OAuth tokens.
        const redirectUrl = 'neighborlink://auth/callback';
        console.log('[GoogleAuth] Native redirect URL:', redirectUrl);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error('[GoogleAuth] OAuth init error:', error);
          toast({
            title: "Authentication Error",
            description: `${error.message} (Code: ${error.code || 'unknown'})`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (data?.url) {
          // Reset loading when the browser closes (user dismissed or flow complete).
          // Navigation on success is handled by useDeepLinkHandler.
          const browserFinishedListener = await Browser.addListener('browserFinished', () => {
            setIsLoading(false);
            browserFinishedListener.remove();
          });

          await Browser.open({ url: data.url, presentationStyle: 'popover' });
        } else {
          setIsLoading(false);
        }
      } else {
        // Bug 4 fix: redirect to /auth (a public route) instead of /auth/complete-profile
        // (a ProtectedRoute). When Supabase redirects back, detectSessionInUrl processes
        // the PKCE tokens and onAuthStateChange fires SIGNED_IN before ProtectedRoute
        // ever renders. Using a public route removes any timing risk.
        //
        // IMPORTANT: Make sure this URL is listed in Supabase Dashboard →
        // Authentication → URL Configuration → Redirect URLs.
        const redirectUrl = `${window.location.origin}/auth`;

        console.log('[GoogleAuth] Web OAuth redirect URL:', redirectUrl);

        // Bug 11 fix: signInWithOAuth does not accept a `data` option for user metadata.
        // Location data for Google sign-ups must be collected during profile completion.
        // If location was provided, persist it temporarily so profile completion can
        // pre-populate the fields.
        if (mode === 'signup' && locationData) {
          try {
            sessionStorage.setItem(
              'pending_location_data',
              JSON.stringify(locationData)
            );
          } catch {
            // sessionStorage may be unavailable in some environments — non-fatal
          }
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error('[GoogleAuth] Web OAuth error:', error);
          toast({
            title: "Google Sign-In Failed",
            description: `${error.message}. Please check Google OAuth configuration.`,
            variant: "destructive",
          });
          setIsLoading(false);
        }
        // On success the browser redirects away — no need to reset isLoading.
      }
    } catch (error: any) {
      console.error('[GoogleAuth] Unexpected error:', error);
      toast({
        title: "Authentication Failed",
        description: `Unexpected error: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border border-border hover:bg-muted/50 transition-colors"
      onClick={handleGoogleAuth}
      disabled={isLoading}
    >
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>
          {isLoading
            ? 'Connecting...'
            : mode === 'signin'
              ? 'Continue with Google'
              : 'Sign up with Google'
          }
        </span>
      </div>
    </Button>
  );
};
