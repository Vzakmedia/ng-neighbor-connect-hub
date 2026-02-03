-- Enable RLS on user_2fa table
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own 2FA status (without exposing secrets)
CREATE POLICY "Users can view their own 2FA status" 
ON public.user_2fa 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to insert their own 2FA setup
CREATE POLICY "Users can create their own 2FA setup" 
ON public.user_2fa 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own 2FA settings
CREATE POLICY "Users can update their own 2FA settings" 
ON public.user_2fa 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own 2FA setup
CREATE POLICY "Users can delete their own 2FA setup" 
ON public.user_2fa 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on user_2fa_backup_codes table
ALTER TABLE public.user_2fa_backup_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own backup codes
CREATE POLICY "Users can view their own backup codes" 
ON public.user_2fa_backup_codes 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.user_2fa 
    WHERE user_2fa.id = user_2fa_backup_codes.user_2fa_id 
    AND user_2fa.user_id = auth.uid()
));

-- Create policy for users to insert their own backup codes
CREATE POLICY "Users can create their own backup codes" 
ON public.user_2fa_backup_codes 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_2fa 
    WHERE user_2fa.id = user_2fa_backup_codes.user_2fa_id 
    AND user_2fa.user_id = auth.uid()
));

-- Create policy for users to update their own backup codes (mark as used)
CREATE POLICY "Users can update their own backup codes" 
ON public.user_2fa_backup_codes 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.user_2fa 
    WHERE user_2fa.id = user_2fa_backup_codes.user_2fa_id 
    AND user_2fa.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_2fa 
    WHERE user_2fa.id = user_2fa_backup_codes.user_2fa_id 
    AND user_2fa.user_id = auth.uid()
));

-- Create policy for users to delete their own backup codes
CREATE POLICY "Users can delete their own backup codes" 
ON public.user_2fa_backup_codes 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.user_2fa 
    WHERE user_2fa.id = user_2fa_backup_codes.user_2fa_id 
    AND user_2fa.user_id = auth.uid()
));

-- Enable RLS on user_2fa_attempts table
ALTER TABLE public.user_2fa_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own 2FA attempts
CREATE POLICY "Users can view their own 2FA attempts" 
ON public.user_2fa_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for system to log 2FA attempts
CREATE POLICY "System can log 2FA attempts" 
ON public.user_2fa_attempts 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view 2FA attempts for security monitoring
CREATE POLICY "Admins can view 2FA attempts" 
ON public.user_2fa_attempts 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));