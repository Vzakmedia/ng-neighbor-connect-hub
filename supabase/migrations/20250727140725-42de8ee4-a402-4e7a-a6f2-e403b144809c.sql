-- Create service availability table
CREATE TABLE public.service_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  max_bookings INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, date, start_time, end_time)
);

-- Enable RLS
ALTER TABLE public.service_availability ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service providers can manage their availability" 
ON public.service_availability 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view availability for booking" 
ON public.service_availability 
FOR SELECT 
USING (is_available = true);

-- Add trigger for updating timestamps
CREATE TRIGGER update_service_availability_updated_at
BEFORE UPDATE ON public.service_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();