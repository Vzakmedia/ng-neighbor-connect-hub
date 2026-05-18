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
            try { sessionStorage.setItem('post_auth_redirect', '/auth/complete-profile'); } catch {}
            navigate('/auth', { replace: true });
            return;
          }

          // Close the in-app browser before doing async session work
          const closeBrowser = async () => {
            try {
              const { Browser } = await import('@capacitor/browser');
              await Browser.close();
            } catch {}
          };

          const handleSessionUser = async (user: any) => {
            let destination = '/dashboard';
            if (user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, city, state')
                .eq('user_id', user.id)
                .single();

              if (!profile?.full_name || !profile?.city || !profile?.state) {
                console.log('[DeepLink] Profile incomplete, redirecting to complete-profile');
                destination = '/auth/complete-profile';
              } else {
                console.log('[DeepLink] Auth complete, going to dashboard');
                toast({ title: 'Welcome!', description: "You've been successfully signed in." });
              }
            }
            // Navigate to /auth (public) instead of the destination directly.
            // At this point the SIGNED_IN event has fired in Supabase but React's
            // useAuth state hasn't re-rendered yet — navigating straight to a
            // ProtectedRoute causes it to redirect back to /auth, which mounts
            // NativeAppWrapper and shows a blank green screen. Storing the
            // destination and going through the public /auth route lets Auth.tsx
            // redirect once React state is hydrated.
            try { sessionStorage.setItem('post_auth_redirect', destination); } catch {}
            navigate('/auth', { replace: true });
          };

          // ── PKCE flow: callback delivers ?code=XXX (flowType: 'pkce') ──────
          const code = hashParams.get('code') || searchParams.get('code');

          if (code) {
            console.log('[DeepLink] PKCE code found, exchanging for session');
            // Synchronously flag that deep-link auth is in progress so that
            // PlatformRoot's "user authenticated → navigate to /dashboard"
            // effect does NOT race against us between the SIGNED_IN event
            // (which sets user state) and our explicit navigate below.
            try { sessionStorage.setItem('deep_link_auth_in_progress', '1'); } catch {}
            try {
              await closeBrowser();

              const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code);

              if (codeError) {
                console.error('[DeepLink] Code exchange error:', codeError);
                toast({
                  variant: 'destructive',
                  title: 'Authentication Failed',
                  description: codeError.message || 'Could not complete sign in.',
                });
                navigate('/auth');
                return;
              }

              console.log('[DeepLink] PKCE session established');
              await handleSessionUser(data?.user);
              return;
            } finally {
              try { sessionStorage.removeItem('deep_link_auth_in_progress'); } catch {}
            }
          }

          // ── Implicit / legacy flow: access_token + refresh_token in hash ──
          const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[DeepLink] Implicit tokens found, setting session');
            try { sessionStorage.setItem('deep_link_auth_in_progress', '1'); } catch {}
            try {
              await closeBrowser();

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
              await handleSessionUser(data?.user);
              return;
            } finally {
              try { sessionStorage.removeItem('deep_link_auth_in_progress'); } catch {}
            }
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
