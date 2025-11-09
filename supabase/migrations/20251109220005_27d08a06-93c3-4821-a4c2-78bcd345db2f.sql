-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'enterprise')),
  billing_email TEXT NOT NULL,
  technical_contact_email TEXT NOT NULL,
  website TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enterprise_api_keys table
CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.api_access_requests(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'development', 'staging')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revocation_reason TEXT
);

-- Create api_key_usage_logs table
CREATE TABLE IF NOT EXISTS public.api_key_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.enterprise_api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add company_id and api_key_id columns to api_access_requests
ALTER TABLE public.api_access_requests 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES public.enterprise_api_keys(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_key_hash ON public.enterprise_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_key_prefix ON public.enterprise_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_company_id ON public.enterprise_api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_assigned_to ON public.enterprise_api_keys(assigned_to);
CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_is_active ON public.enterprise_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_api_key_id ON public.api_key_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_created_at ON public.api_key_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_access_requests_company_id ON public.api_access_requests(company_id);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Admins can view all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can insert companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- RLS Policies for enterprise_api_keys
CREATE POLICY "Admins can view all API keys"
  ON public.enterprise_api_keys FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Users can view their assigned API keys"
  ON public.enterprise_api_keys FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins can insert API keys"
  ON public.enterprise_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can update API keys"
  ON public.enterprise_api_keys FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- RLS Policies for api_key_usage_logs
CREATE POLICY "Admins can view all usage logs"
  ON public.api_key_usage_logs FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Users can view logs for their API keys"
  ON public.api_key_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enterprise_api_keys
      WHERE enterprise_api_keys.id = api_key_usage_logs.api_key_id
      AND enterprise_api_keys.assigned_to = auth.uid()
    )
  );

CREATE POLICY "System can insert usage logs"
  ON public.api_key_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enterprise_api_keys_updated_at
  BEFORE UPDATE ON public.enterprise_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to validate API key
CREATE OR REPLACE FUNCTION public.validate_api_key(key_hash_input TEXT)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  permissions JSONB,
  rate_limit_per_hour INTEGER,
  rate_limit_per_day INTEGER,
  is_active BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  environment TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id,
    k.company_id,
    k.permissions,
    k.rate_limit_per_hour,
    k.rate_limit_per_day,
    k.is_active,
    k.expires_at,
    k.environment
  FROM public.enterprise_api_keys k
  WHERE k.key_hash = key_hash_input
    AND k.is_active = true
    AND (k.expires_at IS NULL OR k.expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to increment key usage
CREATE OR REPLACE FUNCTION public.increment_key_usage(key_hash_input TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.enterprise_api_keys
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE key_hash = key_hash_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(key_hash_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_api_key_id UUID;
  v_hourly_limit INTEGER;
  v_daily_limit INTEGER;
  v_hourly_count INTEGER;
  v_daily_count INTEGER;
BEGIN
  -- Get API key details
  SELECT id, rate_limit_per_hour, rate_limit_per_day
  INTO v_api_key_id, v_hourly_limit, v_daily_limit
  FROM public.enterprise_api_keys
  WHERE key_hash = key_hash_input;

  IF v_api_key_id IS NULL THEN
    RETURN false;
  END IF;

  -- Count requests in the last hour
  SELECT COUNT(*)
  INTO v_hourly_count
  FROM public.api_key_usage_logs
  WHERE api_key_id = v_api_key_id
    AND created_at > now() - INTERVAL '1 hour';

  -- Count requests in the last day
  SELECT COUNT(*)
  INTO v_daily_count
  FROM public.api_key_usage_logs
  WHERE api_key_id = v_api_key_id
    AND created_at > now() - INTERVAL '1 day';

  -- Return true if within limits
  RETURN v_hourly_count < v_hourly_limit AND v_daily_count < v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;