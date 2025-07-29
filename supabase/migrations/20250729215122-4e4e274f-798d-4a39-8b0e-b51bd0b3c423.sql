-- Create staff invitations table
CREATE TABLE public.staff_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    invited_role app_role NOT NULL,
    invitation_code text NOT NULL UNIQUE,
    invited_by uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Super admins can manage staff invitations"
ON public.staff_invitations
FOR ALL
TO authenticated
USING (has_staff_permission(auth.uid(), 'user_management', 'read'))
WITH CHECK (has_staff_permission(auth.uid(), 'user_management', 'write'));

CREATE POLICY "Users can view invitations for their email"
ON public.staff_invitations
FOR SELECT
TO authenticated
USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    has_staff_permission(auth.uid(), 'user_management', 'read')
);

-- Function to generate secure invitation codes
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN upper(substring(md5(random()::text || clock_timestamp()::text), 1, 12));
END;
$$;

-- Function to create staff invitation
CREATE OR REPLACE FUNCTION public.create_staff_invitation(
    _email text,
    _role app_role,
    _invited_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    invitation_id uuid;
    invitation_code text;
BEGIN
    -- Check if user has permission to invite staff
    IF NOT has_staff_permission(_invited_by, 'user_management', 'write') THEN
        RAISE EXCEPTION 'Insufficient permissions to create staff invitation';
    END IF;
    
    -- Generate unique invitation code
    invitation_code := generate_invitation_code();
    
    -- Deactivate any existing invitations for this email
    UPDATE public.staff_invitations 
    SET is_active = false 
    WHERE email = _email AND is_active = true;
    
    -- Create new invitation
    INSERT INTO public.staff_invitations (
        email, 
        invited_role, 
        invitation_code, 
        invited_by
    )
    VALUES (_email, _role, invitation_code, _invited_by)
    RETURNING id INTO invitation_id;
    
    -- Log the activity
    PERFORM log_staff_activity(
        'create_staff_invitation',
        'staff_invitation',
        invitation_id,
        jsonb_build_object('email', _email, 'role', _role)
    );
    
    RETURN invitation_id;
END;
$$;

-- Function to accept staff invitation
CREATE OR REPLACE FUNCTION public.accept_staff_invitation(
    _invitation_code text,
    _user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    invitation_record record;
    user_email text;
BEGIN
    -- Get user email
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = _user_id;
    
    -- Find valid invitation
    SELECT * INTO invitation_record
    FROM public.staff_invitations
    WHERE invitation_code = _invitation_code
    AND email = user_email
    AND is_active = true
    AND expires_at > now()
    AND used_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Mark invitation as used
    UPDATE public.staff_invitations
    SET used_at = now(), is_active = false
    WHERE id = invitation_record.id;
    
    -- Assign role to user (remove existing roles first)
    DELETE FROM public.user_roles WHERE user_id = _user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, invitation_record.invited_role);
    
    -- Log the activity
    PERFORM log_staff_activity(
        'accept_staff_invitation',
        'user_role',
        _user_id,
        jsonb_build_object('role', invitation_record.invited_role, 'invitation_id', invitation_record.id)
    );
    
    RETURN true;
END;
$$;

-- Add trigger for invitation updates
CREATE TRIGGER update_staff_invitations_updated_at
    BEFORE UPDATE ON public.staff_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.staff_invitations TO authenticated;

-- Add user management permission for super admins
INSERT INTO public.staff_permissions (role, permission_name, can_read, can_write, can_delete) VALUES
('super_admin', 'user_management', true, true, true)
ON CONFLICT (role, permission_name) DO UPDATE SET
can_read = EXCLUDED.can_read,
can_write = EXCLUDED.can_write,
can_delete = EXCLUDED.can_delete;