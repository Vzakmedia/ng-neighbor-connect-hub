import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

interface NativeGoogleAuthProps {
  mode: 'signin' | 'signup';
  locationData?: {
    state: string;
    city: string;
    neighborhood: string;
    address: string;
  };
}

export const NativeGoogleAuth = ({ mode, locationData }: NativeGoogleAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    console.log(`[NativeGoogleAuth] Starting ${mode} flow, isNative: ${isNativePlatform()}`);
    
    try {
      if (isNativePlatform()) {
        // Use in-app browser for native OAuth
        const { Browser } = await import('@capacitor/browser');
        const { App } = await import('@capacitor/app');

        // Get OAuth URL from Supabase
        const redirectUrl = 'neighborlink://auth/callback';
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error('[NativeGoogleAuth] OAuth error:', error);
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (data?.url) {
          console.log('[NativeGoogleAuth] Opening OAuth URL in browser:', data.url);
          
          // Set up listener for the callback
          const urlListener = await App.addListener('appUrlOpen', async (event) => {
            console.log('[NativeGoogleAuth] Deep link received:', event.url);
            
            // Close the browser
            await Browser.close();
            urlListener.remove();
            
            try {
              const url = new URL(event.url);
              const params = new URLSearchParams(url.hash.substring(1) || url.search);
              
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              const errorParam = params.get('error');

              if (errorParam) {
                console.error('[NativeGoogleAuth] OAuth returned error:', errorParam);
                toast({
                  title: "Authentication Failed",
                  description: params.get('error_description') || errorParam,
                  variant: "destructive",
                });
                setIsLoading(false);
                return;
              }

              if (accessToken && refreshToken) {
                console.log('[NativeGoogleAuth] Setting session from tokens');
                const { error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

                if (sessionError) {
                  console.error('[NativeGoogleAuth] Session error:', sessionError);
                  toast({
                    title: "Authentication Failed",
                    description: "Could not complete sign in.",
                    variant: "destructive",
                  });
                  setIsLoading(false);
                  return;
                }

                // Check profile completeness
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, city, state')
                    .eq('user_id', session.user.id)
                    .single();

                  if (!profile?.full_name || !profile?.city || !profile?.state) {
                    navigate('/auth/complete-profile');
                  } else {
                    toast({
                      title: "Welcome!",
                      description: "You've been successfully signed in.",
                    });
                    navigate('/dashboard');
                  }
                }
              }
            } catch (err) {
              console.error('[NativeGoogleAuth] Error processing callback:', err);
              toast({
                title: "Authentication Error",
                description: "Could not process authentication response.",
                variant: "destructive",
              });
            }
            setIsLoading(false);
          });

          // Open the OAuth URL in an in-app browser
          await Browser.open({ 
            url: data.url,
            presentationStyle: 'popover',
          });
        }
      } else {
        // Web flow - use standard OAuth
        const redirectUrl = `${window.location.origin}/auth/complete-profile`;
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            ...(mode === 'signup' && locationData && {
              data: locationData,
            }),
          },
        });

        if (error) {
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('[NativeGoogleAuth] Unexpected error:', error);
      toast({
        title: "Authentication Failed",
        description: "An unexpected error occurred. Please try again.",
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
        <svg 
          className="w-5 h-5" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            fill="#4285F4" 
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path 
            fill="#34A853" 
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path 
            fill="#FBBC05" 
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path 
            fill="#EA4335" 
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
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
