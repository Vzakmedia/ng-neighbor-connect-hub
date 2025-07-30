import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Shield } from "lucide-react";
import { RateLimiter } from "@/components/security/RateLimiter";
import { SecureInput } from "@/components/auth/SecureAuthForms";

interface LoginFormProps {
  onSwitchToReset: () => void;
}

export const LoginForm = ({ onSwitchToReset }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent, recordAttempt?: () => void) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed attempt for rate limiting
        if (recordAttempt) recordAttempt();
        
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
      }
    } catch (error) {
      // Record failed attempt for rate limiting
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
      )}
    </RateLimiter>
  );
};