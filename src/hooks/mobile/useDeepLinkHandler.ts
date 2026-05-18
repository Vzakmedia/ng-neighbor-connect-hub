import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Deep Link Handler for iOS/Android OAuth callbacks and email verification links.
 * Handles all neighborlink:// deep links for authentication flows.
 *
 * This is the single source of truth for deep-link auth handling — GoogleAuthButton
 * must NOT register its own appUrlOpen listener to avoid duplicate processing.
 */
export const useDeepLinkHandler = () => {
  const navigate = useNavigate();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    if (!(window as any).Capacitor?.isNativePlatform?.()) {
      console.log('[DeepLink] Not on native platform, skipping');
      return;
    }

    isInitialized.current = true;
    let cleanup: (() => void) | undefined;

    const handleDeepLink = async (url: string) => {
      console.log('[DeepLink] Processing URL:', url);

      try {
        const parsedUrl = new URL(url);
        console.log('[DeepLink] Parsed:', {
          host: parsedUrl.host,
          pathname: parsedUrl.pathname,
          hash: parsedUrl.hash,
          search: parsedUrl.search,
        });

        if (parsedUrl.host === 'auth' || parsedUrl.pathname.startsWith('/auth')) {
          const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
          const searchParams = new URLSearchParams(parsedUrl.search);

          const error = hashParams.get('error') || searchParams.get('error');
          const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

          if (error) {
            console.error('[DeepLink] Auth error:', error, errorDescription);
            toast({
              variant: 'destructive',
              title: 'Authentication Error',
              description: errorDescription || error,
            });
            navigate('/auth');
            return;
          }

          // Bug 2 fix: handle token_hash from email verification links.
          // Supabase sends token_hash + type (not access_token) for email confirmation.
          const tokenHash = hashParams.get('token_hash') || searchParams.get('token_hash');
          const authType = hashParams.get('type') || searchParams.get('type');

          if (tokenHash && authType) {
            console.log('[DeepLink] Email verification token_hash found, verifying...');

            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: authType as 'email' | 'signup',
            });

            if (verifyError) {
              console.error('[DeepLink] Verification error:', verifyError);
              toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: verifyError.message,
              });
              navigate('/auth');
              return;
            }

            console.log('[DeepLink] Email verified successfully');
            toast({
              title: 'Email Verified!',
              description: "Your email has been verified. Let's set up your profile.",
            });
            navigate('/auth/complete-profile');
            return;
          }

          // OAuth callback: access_token + refresh_token in the URL
          const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[DeepLink] OAuth tokens found, setting session');

            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[DeepLink] Session error:', sessionError);
              toast({
                variant: 'destructive',
                title: 'Authentication Failed',
                description: 'Could not complete sign in.',
              });
              navigate('/auth');
              return;
            }

            console.log('[DeepLink] Session set successfully');

            if (data?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, city, state')
                .eq('user_id', data.user.id)
                .single();

              if (!profile?.full_name || !profile?.city || !profile?.state) {
                console.log('[DeepLink] Profile incomplete, redirecting to complete-profile');
                navigate('/auth/complete-profile');
              } else {
                console.log('[DeepLink] Auth complete, going to dashboard');
                toast({
                  title: 'Welcome!',
                  description: "You've been successfully signed in.",
                });
                navigate('/dashboard');
              }
            }
            return;
          }

          // No tokens at all — check for an existing session
          console.log('[DeepLink] No tokens in URL, checking existing session');
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            navigate('/dashboard');
          } else {
            navigate('/auth');
          }
        } else {
          console.log('[DeepLink] Non-auth deep link:', parsedUrl.pathname);
          if (parsedUrl.pathname) {
            navigate(parsedUrl.pathname);
          }
        }
      } catch (err) {
        console.error('[DeepLink] Processing error:', err);
        toast({
          variant: 'destructive',
          title: 'Link Error',
          description: 'Could not process the link.',
        });
        navigate('/auth');
      }
    };

    const setupDeepLinkListener = async () => {
      try {
        const { App } = await import('@capacitor/app');

        const launchUrl = await App.getLaunchUrl();
        if (launchUrl?.url) {
          console.log('[DeepLink] App launched with URL:', launchUrl.url);
          handleDeepLink(launchUrl.url);
        }

        const listener = await App.addListener('appUrlOpen', (event) => {
          console.log('[DeepLink] App URL opened:', event.url);
          handleDeepLink(event.url);
        });

        cleanup = () => { listener.remove(); };
        console.log('[DeepLink] Listener registered');
      } catch (err) {
        console.error('[DeepLink] Setup failed:', err);
      }
    };

    setupDeepLinkListener();

    return () => { cleanup?.(); };
  }, [navigate]);
};
