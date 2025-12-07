import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Deep Link Handler for iOS/Android OAuth callbacks
 * Handles neighborlink:// deep links for authentication flows
 */
export const useDeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Use window.Capacitor for safe platform check
    if (!window.Capacitor?.isNativePlatform?.()) {
      return;
    }

    let cleanup: (() => void) | undefined;

    const setupDeepLinkListener = async () => {
      try {
        // Dynamic import only on native
        const { App } = await import('@capacitor/app');
        
        // Handle app opened via deep link
        const listener = await App.addListener('appUrlOpen', async (event) => {
          console.log('Deep link received:', event.url);

          try {
            // Parse the deep link URL
            const url = new URL(event.url);
            
            // Handle auth callback (neighborlink://auth/callback)
            if (url.host === 'auth' || url.pathname.includes('/auth')) {
              const params = new URLSearchParams(url.search || url.hash.substring(1));
              
              // Check for auth tokens
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              const error = params.get('error');
              const errorDescription = params.get('error_description');

              if (error) {
                console.error('Auth error from deep link:', error, errorDescription);
                toast({
                  variant: "destructive",
                  title: "Authentication Error",
                  description: errorDescription || error,
                });
                navigate('/auth');
                return;
              }

              if (accessToken && refreshToken) {
                console.log('Setting session from deep link tokens');
                
                // Set the session with the tokens from the deep link
                const { data, error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

                if (sessionError) {
                  console.error('Failed to set session:', sessionError);
                  toast({
                    variant: "destructive",
                    title: "Authentication Failed",
                    description: "Could not complete sign in. Please try again.",
                  });
                  navigate('/auth');
                  return;
                }

                // Check if user needs to complete profile
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('display_name, city, state')
                  .eq('user_id', data.user?.id)
                  .single();

                if (!profile || !profile.display_name || !profile.city || !profile.state) {
                  console.log('Profile incomplete, redirecting to complete profile');
                  navigate('/auth/complete-profile');
                } else {
                  console.log('Auth successful, redirecting to dashboard');
                  toast({
                    title: "Welcome back!",
                    description: "You've been successfully signed in.",
                  });
                  navigate('/dashboard');
                }
              } else {
                // If no tokens but no error, try to get existing session
                console.log('No tokens in deep link, checking existing session');
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session) {
                  navigate('/dashboard');
                } else {
                  navigate('/auth');
                }
              }
            } else {
              // Handle other deep links (future functionality)
              console.log('Unknown deep link pattern:', url.toString());
            }
          } catch (error) {
            console.error('Error handling deep link:', error);
            toast({
              variant: "destructive",
              title: "Deep Link Error",
              description: "Could not process the link. Please try again.",
            });
            navigate('/auth');
          }
        });

        cleanup = () => {
          listener.remove();
        };
      } catch (error) {
        console.error('Failed to setup deep link listener:', error);
      }
    };

    setupDeepLinkListener();

    return () => {
      cleanup?.();
    };
  }, [navigate]);
};
