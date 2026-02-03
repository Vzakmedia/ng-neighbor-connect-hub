-- Grant super_admin role to the current user
-- First, remove any existing roles for this user to avoid conflicts
DELETE FROM public.user_roles 
WHERE user_id = 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48';

-- Grant super_admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'super_admin');