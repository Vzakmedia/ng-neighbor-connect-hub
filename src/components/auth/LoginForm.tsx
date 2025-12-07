import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Shield, AlertCircle } from '@/lib/icons';
import { RateLimiter } from "@/components/security/RateLimiter";
import { SecureInput } from "@/components/auth/SecureAuthForms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isPrivateBrowsing, detectIOSAuth, getIOSAuthError } from "@/utils/iosAuthHelper";


interface LoginFormProps {
  onSwitchToReset: () => void;
}

export const LoginForm = ({ onSwitchToReset }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showIOSWarning, setShowIOSWarning] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check for iOS private browsing on mount
  useEffect(() => {
    const checkPrivateMode = async () => {
      const { isIOSSafari } = detectIOSAuth();
      if (isIOSSafari) {
        const inPrivateMode = await isPrivateBrowsing();
        setShowIOSWarning(inPrivateMode);
      }
    };
    checkPrivateMode();
  }, []);

  const handleLogin = async (e: React.FormEvent, recordAttempt?: () => void) => {
    e.preventDefault();
    setIsLoading(true);

    const isNative = (window as any).Capacitor?.isNativePlatform?.() === true;
    console.log(`[LoginForm] Starting login, platform: ${isNative ? 'native' : 'web'}`);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log(`[LoginForm] signInWithPassword result:`, { 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        error: error?.message 
      });

      if (error) {
        if (recordAttempt) recordAttempt();
        
        const errorMessage = getIOSAuthError(error.message);
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      if (data.user && data.session) {
        console.log(`[LoginForm] Login successful, verifying session...`);
        
        // Verify session is properly set
        const { data: sessionCheck } = await supabase.auth.getSession();
        console.log(`[LoginForm] Session verification:`, { 
          hasSession: !!sessionCheck?.session,
          userId: sessionCheck?.session?.user?.id 
        });

        if (!sessionCheck?.session) {
          console.error(`[LoginForm] Session not persisted after login`);
          toast({
            title: "Login Error",
            description: "Session failed to persist. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Check if 2FA is enabled for this user
        const { data: user2fa } = await supabase
          .from('user_2fa')
          .select('is_enabled')
          .eq('user_id', data.user.id)
          .single();

        if (user2fa?.is_enabled) {
          sessionStorage.setItem('pending2FA', data.user.id);
          await supabase.auth.signOut();
          navigate(`/auth/2fa-verify?userId=${data.user.id}`);
        } else {
          // Check if this is the user's first login
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_login_completed')
            .eq('user_id', data.user.id)
            .single();

          const isFirstLogin = !profile?.first_login_completed;

          if (isFirstLogin) {
            await supabase
              .from('profiles')
              .update({ first_login_completed: true })
              .eq('user_id', data.user.id);
          }

          toast({
            title: isFirstLogin ? "Welcome to NeighborLink!" : "Welcome back!",
            description: isFirstLogin 
              ? "You've successfully signed in for the first time." 
              : "You've been successfully logged in.",
          });

          console.log(`[LoginForm] Navigating to dashboard...`);
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error(`[LoginForm] Unexpected error:`, error);
      if (recordAttempt) recordAttempt();
      
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RateLimiter action="login" maxAttempts={5} timeWindow={15}>
      {(isLimited, attemptsLeft, timeLeft) => (
        <div className="space-y-4">
          {/* iOS Private Browsing Warning */}
          {showIOSWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Private Browsing mode detected. Please disable Private Browsing in Safari Settings for authentication to work properly.
              </AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={(e) => handleLogin(e, isLimited ? undefined : () => {})} 
            className="space-y-4"
          >
            {!isLimited && attemptsLeft < 5 && attemptsLeft > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-700">
                    {attemptsLeft} login attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <SecureInput
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={setEmail}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLimited}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLimited}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || isLimited}
          >
            {isLoading ? "Signing in..." : isLimited ? "Account Temporarily Locked" : "Sign In"}
          </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToReset}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={isLimited}
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>
      )}
    </RateLimiter>
  );
};