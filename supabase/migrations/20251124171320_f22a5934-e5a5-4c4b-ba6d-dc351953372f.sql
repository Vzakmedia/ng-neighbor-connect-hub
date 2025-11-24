-- Create email_audit_logs table to track admin email actions
CREATE TABLE IF NOT EXISTS public.email_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('verification', 'password_reset', 'admin_manual_verification', 'admin_resend')),
  action_type TEXT NOT NULL CHECK (action_type IN ('sent', 'failed', 'manually_verified')),
  sent_by_admin_id UUID,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_audit_logs_user_id ON public.email_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_audit_logs_created_at ON public.email_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_audit_logs_admin_id ON public.email_audit_logs(sent_by_admin_id);

-- Enable RLS
ALTER TABLE public.email_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage email audit logs (admin actions will be done via edge functions)
CREATE POLICY "Service role can manage email audit logs"
  ON public.email_audit_logs
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.email_audit_logs IS 'Tracks all email-related actions performed by admins for audit purposes';