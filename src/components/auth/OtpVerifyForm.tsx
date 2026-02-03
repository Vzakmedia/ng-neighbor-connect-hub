import { useState, useEffect } from "react";
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

    const [timeLeft, setTimeLeft] = useState(60);

    // Timer countdown effect
    useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [timeLeft]);

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
        if (timeLeft > 0) return;

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
            // Reset timer
            setTimeLeft(60);
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

                    <div className="text-sm text-center">
                        <p className="text-muted-foreground mb-2">Didn't receive the code?</p>
                        <Button
                            type="button"
                            variant={timeLeft > 0 ? "ghost" : "link"}
                            className="text-primary hover:text-primary/90 p-0 h-auto font-medium"
                            onClick={handleResend}
                            disabled={resending || timeLeft > 0}
                        >
                            {resending ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Resending...
                                </>
                            ) : timeLeft > 0 ? (
                                `Resend code in ${timeLeft}s`
                            ) : (
                                "Resend Code"
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};
