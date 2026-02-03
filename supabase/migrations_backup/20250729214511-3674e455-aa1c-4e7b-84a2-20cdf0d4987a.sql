-- Enable realtime for all staff dashboard tables
ALTER TABLE public.content_reports REPLICA IDENTITY FULL;
ALTER TABLE public.panic_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.businesses REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.marketplace_items REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.panic_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Create helper view for staff dashboard stats
CREATE OR REPLACE VIEW public.staff_dashboard_stats AS
SELECT 
  COUNT(*) FILTER (WHERE profiles.created_at >= CURRENT_DATE) as new_users_today,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE content_reports.status = 'pending') as pending_reports,
  COUNT(*) FILTER (WHERE panic_alerts.is_resolved = false) as active_alerts,
  COUNT(*) FILTER (WHERE marketplace_items.status = 'active') as active_marketplace_items,
  COUNT(*) FILTER (WHERE businesses.verification_status = 'pending') as pending_business_verifications
FROM public.profiles
LEFT JOIN public.content_reports ON true
LEFT JOIN public.panic_alerts ON true  
LEFT JOIN public.marketplace_items ON true
LEFT JOIN public.businesses ON true;

-- Grant access to staff roles
GRANT SELECT ON public.staff_dashboard_stats TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Staff can view dashboard stats"
ON public.staff_dashboard_stats
FOR SELECT
TO authenticated
USING (
  has_staff_permission(auth.uid(), 'dashboard_stats', 'read')
);

-- Enable RLS on the view
ALTER VIEW public.staff_dashboard_stats SET (security_invoker = true);