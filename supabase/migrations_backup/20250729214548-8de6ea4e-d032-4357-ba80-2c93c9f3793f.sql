-- Enable realtime for staff dashboard tables (skip already added ones)
ALTER TABLE public.content_reports REPLICA IDENTITY FULL;
ALTER TABLE public.businesses REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.marketplace_items REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;

-- Add tables to realtime publication (only add if not already present)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.content_reports;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_items;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
END $$;

-- Add missing permissions for comprehensive staff system
INSERT INTO public.staff_permissions (role, permission_name, can_read, can_write, can_delete) VALUES
-- Dashboard stats permission
('staff', 'dashboard_stats', true, false, false),
('moderator', 'dashboard_stats', true, false, false),
('manager', 'dashboard_stats', true, false, false),
('support', 'dashboard_stats', true, false, false),
('super_admin', 'dashboard_stats', true, true, true),

-- Emergency response permissions
('support', 'emergency_response', true, true, false),
('moderator', 'emergency_response', true, true, false),
('manager', 'emergency_response', true, true, true),
('super_admin', 'emergency_response', true, true, true),

-- Analytics permissions
('manager', 'analytics', true, false, false),
('super_admin', 'analytics', true, true, true)

ON CONFLICT (role, permission_name) DO UPDATE SET
can_read = EXCLUDED.can_read,
can_write = EXCLUDED.can_write,
can_delete = EXCLUDED.can_delete;