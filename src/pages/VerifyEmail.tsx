import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if this is a confirmation callback
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (token && type === 'signup') {
          // This is an email confirmation callback
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          if (error) {
            setError(error.message);
          } else {
            setVerified(true);
            toast({
              title: "Email Verified!",
              description: "Your email has been confirmed. Complete your profile to continue.",
            });
            // Redirect to profile completion after a short delay
            setTimeout(() => {
              navigate("/auth/complete-profile");
            }, 2000);
          }
        } else {
          // Check if user is already logged in and verified
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            navigate("/auth/complete-profile");
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
            emailRedirectTo: window.location.origin + '/auth/verify-email'
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
    </div>
  );
};

export default VerifyEmail;