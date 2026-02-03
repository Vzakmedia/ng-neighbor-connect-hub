-- Priority 1: Create missing events table and fix security vulnerabilities (fixed)

-- Create events table (missing but referenced in code)
CREATE TABLE IF NOT EXISTS public.events (
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

-- Enable RLS on events table if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'events' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for events (with IF NOT EXISTS equivalent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can view public events') THEN
    EXECUTE 'CREATE POLICY "Users can view public events" ON public.events FOR SELECT USING (is_public = true OR auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can create their own events') THEN
    EXECUTE 'CREATE POLICY "Users can create their own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can update their own events') THEN
    EXECUTE 'CREATE POLICY "Users can update their own events" ON public.events FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can delete their own events') THEN
    EXECUTE 'CREATE POLICY "Users can delete their own events" ON public.events FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END$$;

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

-- Create update trigger for events if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_events_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END$$;