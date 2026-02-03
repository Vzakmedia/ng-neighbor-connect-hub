-- Create promotions table for advertising services and marketplace items
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'item')),
  title TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  budget NUMERIC NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'local' CHECK (target_audience IN ('local', 'city', 'state', 'national')),
  promotion_type TEXT NOT NULL DEFAULT 'featured' CHECK (promotion_type IN ('featured', 'boost', 'highlight', 'banner')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own promotions" 
ON public.promotions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own promotions" 
ON public.promotions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own promotions" 
ON public.promotions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own promotions" 
ON public.promotions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();