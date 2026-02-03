-- Create a new table for service weekly availability patterns
CREATE TABLE public.service_weekly_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_bookings INTEGER DEFAULT 1,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_weekly_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for service weekly availability
CREATE POLICY "Users can view service weekly availability" 
ON public.service_weekly_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Service providers can manage their weekly availability" 
ON public.service_weekly_availability 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_service_weekly_availability_updated_at
BEFORE UPDATE ON public.service_weekly_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_service_weekly_availability_service_day 
ON public.service_weekly_availability(service_id, day_of_week);

CREATE INDEX idx_service_weekly_availability_user 
ON public.service_weekly_availability(user_id);