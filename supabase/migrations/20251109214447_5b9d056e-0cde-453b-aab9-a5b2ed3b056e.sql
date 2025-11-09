-- Create api_access_requests table
CREATE TABLE IF NOT EXISTS public.api_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('enterprise', 'technical', 'partnership', 'other')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  internal_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_access_requests_email ON public.api_access_requests(email);
CREATE INDEX IF NOT EXISTS idx_api_access_requests_status ON public.api_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_api_access_requests_created_at ON public.api_access_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.api_access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts
CREATE POLICY "Users can submit API access requests"
ON public.api_access_requests
FOR INSERT
WITH CHECK (true);

-- Policy: Staff can view all requests
CREATE POLICY "Staff can view all API requests"
ON public.api_access_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin', 'support', 'manager')
  )
);

-- Policy: Staff can update requests
CREATE POLICY "Staff can update API requests"
ON public.api_access_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin', 'support', 'manager')
  )
);

-- Policy: Super admins can delete
CREATE POLICY "Super admins can delete requests"
ON public.api_access_requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_api_access_requests_updated_at
  BEFORE UPDATE ON public.api_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();