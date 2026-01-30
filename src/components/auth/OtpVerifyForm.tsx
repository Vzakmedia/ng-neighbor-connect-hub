import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, Mail } from "@/lib/icons";

interface OtpVerifyFormProps {
    email: string;
}

export const OtpVerifyForm = ({ email }: OtpVerifyFormProps) => {
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter the full 6-digit code.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup',
            });

            if (error) throw error;

            if (data.session) {
                toast({
                    title: "Verified!",
                    description: "Your email has been successfully verified.",
                });
                navigate("/dashboard");
            }
        } catch (error: any) {
            toast({
                title: "Verification Failed",
                description: error.message || "Invalid code. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });

            if (error) throw error;

            toast({
                title: "Code Resent",
                description: "A new verification code has been sent to your email.",
            });
        } catch (error: any) {
            toast({
                title: "Resend Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                    We sent a verification code to <span className="font-medium text-foreground">{email}</span>
                </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-center">
                    <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <div className="space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            "Verify Email"
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="text-sm text-muted-foreground hover:text-primary"
                        onClick={handleResend}
                        disabled={resending}
                    >
                        {resending ? "Resending..." : "Didn't receive code? Resend"}
                    </Button>
                </div>
            </form>
        </div>
    );
};
