-- Assign admin role to the current user to fix business application access
INSERT INTO public.user_roles (user_id, role) 
VALUES ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;