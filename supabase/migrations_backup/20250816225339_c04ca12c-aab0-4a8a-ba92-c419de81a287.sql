-- Enable realtime for service_bookings table
ALTER TABLE public.service_bookings REPLICA IDENTITY FULL;

-- Add service_bookings to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_bookings;

-- Enable realtime for service_weekly_availability table
ALTER TABLE public.service_weekly_availability REPLICA IDENTITY FULL;

-- Add service_weekly_availability to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_weekly_availability;