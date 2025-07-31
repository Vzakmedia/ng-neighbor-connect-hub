-- Create staff_invitations table
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invitation_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for staff invitations
CREATE POLICY "Super admins can manage all staff invitations"
ON public.staff_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Managers can view and create staff invitations"
ON public.staff_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'manager', 'admin')
  )
);

CREATE POLICY "Managers can create staff invitations"
ON public.staff_invitations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'manager', 'admin')
  )
);

-- Create function to accept staff invitation
CREATE OR REPLACE FUNCTION accept_staff_invitation(invitation_code TEXT, user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Find the invitation
  SELECT * INTO invitation_record
  FROM staff_invitations
  WHERE invitation_code = $1
    AND email = user_email
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Mark invitation as used
  UPDATE staff_invitations
  SET status = 'used',
      used_at = now(),
      used_by = auth.uid()
  WHERE id = invitation_record.id;

  -- Add user role
  INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
  VALUES (auth.uid(), invitation_record.role, invitation_record.created_by, now())
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create staff invitation
CREATE OR REPLACE FUNCTION create_staff_invitation(
  invitation_email TEXT,
  invitation_role TEXT
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  role TEXT,
  invitation_code TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  new_invitation RECORD;
BEGIN
  -- Check if user has permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'manager', 'admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to create staff invitations';
  END IF;

  -- Insert invitation
  INSERT INTO staff_invitations (email, role, created_by)
  VALUES (invitation_email, invitation_role, auth.uid())
  RETURNING * INTO new_invitation;

  -- Return the invitation details
  RETURN QUERY
  SELECT 
    new_invitation.id,
    new_invitation.email,
    new_invitation.role,
    new_invitation.invitation_code,
    new_invitation.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;