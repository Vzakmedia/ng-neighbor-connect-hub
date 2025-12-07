import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

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
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    const isNative = isNativePlatform();
    
    console.log('[GoogleAuth] ==========================================');
    console.log('[GoogleAuth] Starting OAuth flow');
    console.log('[GoogleAuth] Mode:', mode);
    console.log('[GoogleAuth] Is Native Platform:', isNative);
    console.log('[GoogleAuth] Current URL:', window.location.href);
    console.log('[GoogleAuth] Origin:', window.location.origin);
    
    try {
      if (isNative) {
        // Native: Use in-app browser for OAuth
        console.log('[GoogleAuth] Using native in-app browser flow');
        const { Browser } = await import('@capacitor/browser');
        const { App } = await import('@capacitor/app');

        const redirectUrl = 'neighborlink://auth/callback';
        console.log('[GoogleAuth] Native redirect URL:', redirectUrl);
        
        console.log('[GoogleAuth] Calling supabase.auth.signInWithOAuth...');
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

        console.log('[GoogleAuth] OAuth response - data:', data);
        console.log('[GoogleAuth] OAuth response - error:', error);

        if (error) {
          console.error('[GoogleAuth] OAuth init error:', error);
          console.error('[GoogleAuth] Error code:', error.code);
          console.error('[GoogleAuth] Error status:', error.status);
          console.error('[GoogleAuth] Error message:', error.message);
          toast({
            title: "Authentication Error",
            description: `${error.message} (Code: ${error.code || 'unknown'})`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (data?.url) {
          console.log('[GoogleAuth] Opening OAuth URL');
          
          // Listen for callback
          const urlListener = await App.addListener('appUrlOpen', async (event) => {
            console.log('[GoogleAuth] Callback received:', event.url);
            await Browser.close();
            urlListener.remove();
            
            try {
              const url = new URL(event.url);
              const hashParams = new URLSearchParams(url.hash.substring(1));
              const searchParams = new URLSearchParams(url.search);
              
              const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
              const errorParam = hashParams.get('error') || searchParams.get('error');

              if (errorParam) {
                const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');
                console.error('[GoogleAuth] OAuth error:', errorParam);
                toast({
                  title: "Authentication Failed",
                  description: errorDesc || errorParam,
                  variant: "destructive",
                });
                setIsLoading(false);
                return;
              }

              if (accessToken && refreshToken) {
                console.log('[GoogleAuth] Setting session');
                const { error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

                if (sessionError) {
                  console.error('[GoogleAuth] Session error:', sessionError);
                  toast({
                    title: "Authentication Failed",
                    description: "Could not complete sign in.",
                    variant: "destructive",
                  });
                  setIsLoading(false);
                  return;
                }

                // Verify and redirect
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
                    toast({ title: "Welcome!", description: "Signed in successfully." });
                    navigate('/dashboard');
                  }
                }
              }
            } catch (err) {
              console.error('[GoogleAuth] Callback error:', err);
              toast({
                title: "Authentication Error",
                description: "Could not process response.",
                variant: "destructive",
              });
            }
            setIsLoading(false);
          });

          await Browser.open({ url: data.url, presentationStyle: 'popover' });
        }
      } else {
        // Web: Standard OAuth redirect
        const redirectUrl = `${window.location.origin}/auth/complete-profile`;
        
        console.log('[GoogleAuth] Using web OAuth redirect flow');
        console.log('[GoogleAuth] Web redirect URL:', redirectUrl);
        console.log('[GoogleAuth] Supabase project:', 'cowiviqhrnmhttugozbz');
        
        console.log('[GoogleAuth] Calling supabase.auth.signInWithOAuth for web...');
        const { data, error } = await supabase.auth.signInWithOAuth({
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

        console.log('[GoogleAuth] Web OAuth response - data:', data);
        console.log('[GoogleAuth] Web OAuth response - URL:', data?.url);
        
        if (error) {
          console.error('[GoogleAuth] Web OAuth error:', error);
          console.error('[GoogleAuth] Error code:', error.code);
          console.error('[GoogleAuth] Error status:', error.status);
          console.error('[GoogleAuth] Error message:', error.message);
          toast({
            title: "Google Sign-In Failed",
            description: `${error.message}. Please check Google OAuth configuration.`,
            variant: "destructive",
          });
          setIsLoading(false);
        } else {
          console.log('[GoogleAuth] OAuth initiated successfully, browser should redirect...');
          toast({
            title: "Redirecting to Google",
            description: "Opening Google sign-in page...",
          });
        }
      }
    } catch (error: any) {
      console.error('[GoogleAuth] Unexpected error:', error);
      console.error('[GoogleAuth] Error name:', error?.name);
      console.error('[GoogleAuth] Error message:', error?.message);
      console.error('[GoogleAuth] Error stack:', error?.stack);
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