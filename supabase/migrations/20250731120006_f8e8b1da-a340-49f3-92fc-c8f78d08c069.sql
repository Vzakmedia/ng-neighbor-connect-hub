-- Fix security warnings by setting search_path for the functions we just created

-- Update accept_staff_invitation function with proper search path
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
  INSERT INTO user_roles (user_id, role)
  VALUES (auth.uid(), invitation_record.role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update create_staff_invitation function with proper search path
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
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'manager', 'admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to create staff invitations';
  END IF;

  -- Insert invitation
  INSERT INTO public.staff_invitations (email, role)
  VALUES (invitation_email, invitation_role)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';