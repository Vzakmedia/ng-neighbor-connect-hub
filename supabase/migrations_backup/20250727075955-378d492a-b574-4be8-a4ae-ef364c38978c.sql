-- Create event_rsvps table for tracking RSVPs
CREATE TABLE public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Create policies for event_rsvps
CREATE POLICY "Users can create their own RSVPs" 
ON public.event_rsvps 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs" 
ON public.event_rsvps 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVPs" 
ON public.event_rsvps 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view RSVPs for events" 
ON public.event_rsvps 
FOR SELECT 
USING (true);

-- Add RSVP enabled field to community_posts for events
ALTER TABLE public.community_posts 
ADD COLUMN rsvp_enabled BOOLEAN DEFAULT false;

-- Add trigger for updated_at
CREATE TRIGGER update_event_rsvps_updated_at
BEFORE UPDATE ON public.event_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();