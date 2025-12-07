import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Deep Link Handler for iOS/Android OAuth callbacks
 * Handles neighborlink:// deep links for authentication flows
 */
export const useDeepLinkHandler = () => {
  const navigate = useNavigate();
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (isInitialized.current) return;
    
    // Use window.Capacitor for safe platform check
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
          search: parsedUrl.search 
        });
        
        // Handle auth callbacks
        if (parsedUrl.host === 'auth' || parsedUrl.pathname.startsWith('/auth')) {
          // Try both hash and search params (OAuth may use either)
          const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
          const searchParams = new URLSearchParams(parsedUrl.search);
          
          const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
          const error = hashParams.get('error') || searchParams.get('error');
          const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

          if (error) {
            console.error('[DeepLink] Auth error:', error, errorDescription);
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: errorDescription || error,
            });
            navigate('/auth');
            return;
          }

          if (accessToken && refreshToken) {
            console.log('[DeepLink] Found tokens, setting session');
            
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[DeepLink] Session error:', sessionError);
              toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: "Could not complete sign in.",
              });
              navigate('/auth');
              return;
            }

            console.log('[DeepLink] Session set successfully');

            // Check profile completeness
            if (data?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, city, state')
                .eq('user_id', data.user.id)
                .single();

              if (!profile?.full_name || !profile?.city || !profile?.state) {
                console.log('[DeepLink] Profile incomplete, redirecting');
                navigate('/auth/complete-profile');
              } else {
                console.log('[DeepLink] Auth complete, going to dashboard');
                toast({
                  title: "Welcome!",
                  description: "You've been successfully signed in.",
                });
                navigate('/dashboard');
              }
            }
          } else {
            // No tokens - check for existing session
            console.log('[DeepLink] No tokens, checking existing session');
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              navigate('/dashboard');
            } else {
              navigate('/auth');
            }
          }
        } else {
          console.log('[DeepLink] Non-auth deep link:', parsedUrl.pathname);
          // Handle other deep links
          if (parsedUrl.pathname) {
            navigate(parsedUrl.pathname);
          }
        }
      } catch (error) {
        console.error('[DeepLink] Processing error:', error);
        toast({
          variant: "destructive",
          title: "Link Error",
          description: "Could not process the link.",
        });
        navigate('/auth');
      }
    };

    const setupDeepLinkListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        // Check if app was opened via deep link
        const launchUrl = await App.getLaunchUrl();
        if (launchUrl?.url) {
          console.log('[DeepLink] App launched with URL:', launchUrl.url);
          handleDeepLink(launchUrl.url);
        }

        // Listen for future deep links
        const listener = await App.addListener('appUrlOpen', (event) => {
          console.log('[DeepLink] App URL opened:', event.url);
          handleDeepLink(event.url);
        });

        cleanup = () => {
          listener.remove();
        };
        
        console.log('[DeepLink] Listener registered');
      } catch (error) {
        console.error('[DeepLink] Setup failed:', error);
      }
    };

    setupDeepLinkListener();

    return () => {
      cleanup?.();
    };
  }, [navigate]);
};
