import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Mail, CheckCircle2, AlertCircle, PartyPopper } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check URL parameters for token_hash
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        console.log('Verification attempt:', { 
          token_hash: token_hash?.substring(0, 10) + '...', 
          type,
          fullURL: window.location.href 
        });
        
        if (token_hash && type) {
          // Accept both 'email' and 'signup' types
          const verifyType = (type === 'email' || type === 'signup') ? 'signup' : type as 'signup';
          
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token_hash,
            type: verifyType
          });

          if (error) {
            console.error('Verification error:', error);
            setError(error.message);
          } else {
            setVerified(true);
            setShowWelcomeDialog(true);
          }
        } else {
          // Also check hash parameters as fallback
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const hash_token = hashParams.get('token_hash');
          const hash_type = hashParams.get('type');
          
          if (hash_token && hash_type) {
            const verifyType = (hash_type === 'email' || hash_type === 'signup') ? 'signup' : hash_type as 'signup';
            
            const { error } = await supabase.auth.verifyOtp({
              token_hash: hash_token,
              type: verifyType
            });
            
            if (error) {
              console.error('Hash verification error:', error);
              setError(error.message);
            } else {
              setVerified(true);
              setShowWelcomeDialog(true);
            }
          } else {
            // Check if user is already logged in and verified
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email_confirmed_at) {
              navigate("/auth/complete-profile");
            } else if (!token_hash && !hash_token) {
              console.error('Missing token_hash parameter in URL');
              setError('Invalid confirmation link. Please check your email for a new verification link.');
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "An error occurred during verification");
      } finally {
        setLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate, toast]);

  const resendVerification = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: session.user.email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify-email`
          }
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Verification Email Sent",
          description: "Please check your email for the new verification link.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to resend verification email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {verified ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : error ? (
              <AlertCircle className="h-6 w-6 text-destructive" />
            ) : (
              <Mail className="h-6 w-6 text-primary" />
            )}
            <CardTitle className="text-2xl">
              {verified ? "Email Verified!" : error ? "Verification Failed" : "Check Your Email"}
            </CardTitle>
          </div>
          <CardDescription>
            {verified 
              ? "Your email has been successfully verified. Redirecting to profile setup..."
              : error 
                ? "There was an issue verifying your email. Please try again."
                : "We've sent you an email with a verification link. Please click the link to continue."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {!verified && !error && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the email? Check your spam folder or click below to resend.
              </p>
              <Button 
                onClick={resendVerification}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>
          )}

          <Button 
            onClick={() => navigate("/auth")}
            variant="ghost"
            className="w-full"
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>

      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center justify-center mb-4 space-y-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <PartyPopper className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Welcome to NeighborLink! 🎉
              </DialogTitle>
            </div>
            <DialogDescription className="text-center space-y-3">
              <p className="text-base">
                Your email has been verified successfully!
              </p>
              <p className="text-sm text-muted-foreground">
                You're now part of the NeighborLink community. Let's complete your profile to help you connect with your neighbors and discover local services.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={() => navigate("/auth/complete-profile")}
              className="w-full"
              size="lg"
            >
              Complete My Profile
            </Button>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Skip for Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifyEmail;