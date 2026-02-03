-- Priority 1: Create missing events table and fix security vulnerabilities

-- Create events table (missing but referenced in code)
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID NOT NULL,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  rsvp_enabled BOOLEAN DEFAULT false,
  image_urls TEXT[] DEFAULT ARRAY[]::text[],
  file_urls JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  max_attendees INTEGER,
  price DECIMAL(10,2) DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Users can view public events" 
ON public.events 
FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON public.events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create event RSVPs table
CREATE TABLE public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('going', 'interested', 'not_going')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Create policies for event_rsvps
CREATE POLICY "Users can manage their own RSVPs" 
ON public.event_rsvps 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view RSVPs for events they can see" 
ON public.event_rsvps 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_rsvps.event_id 
  AND (events.is_public = true OR events.user_id = auth.uid())
));

-- Fix security vulnerabilities: Restrict marketplace_items public access
DROP POLICY IF EXISTS "Anyone can view approved marketplace items" ON public.marketplace_items;
CREATE POLICY "Authenticated users can view approved marketplace items" 
ON public.marketplace_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND approval_status = 'approved');

-- Fix security vulnerabilities: Restrict services public access  
DROP POLICY IF EXISTS "Anyone can view approved services" ON public.services;
CREATE POLICY "Authenticated users can view approved services" 
ON public.services 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND approval_status = 'approved');

-- Fix security vulnerabilities: Restrict businesses public access
DROP POLICY IF EXISTS "Verified businesses are public" ON public.businesses;
CREATE POLICY "Authenticated users can view verified businesses" 
ON public.businesses 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND verification_status = 'verified');

-- Create update trigger for events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();