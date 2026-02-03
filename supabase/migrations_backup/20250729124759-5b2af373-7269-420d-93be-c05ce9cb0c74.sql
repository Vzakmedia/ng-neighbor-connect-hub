-- Create content moderation tables
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'marketplace_item', 'event')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'fake_news', 'violence', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sponsored content management table
CREATE TABLE IF NOT EXISTS public.sponsored_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'event', 'marketplace_item', 'service')),
  content_id UUID NOT NULL,
  promotion_id UUID REFERENCES public.promotions(id),
  boost_type TEXT NOT NULL DEFAULT 'featured' CHECK (boost_type IN ('featured', 'priority', 'highlighted', 'trending')),
  boost_level INTEGER NOT NULL DEFAULT 1 CHECK (boost_level BETWEEN 1 AND 5),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  budget NUMERIC NOT NULL DEFAULT 0,
  daily_budget NUMERIC,
  target_audience JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content moderation policies
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create content reports" 
ON public.content_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.content_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" 
ON public.content_reports 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update report status" 
ON public.content_reports 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Create sponsored content policies
ALTER TABLE public.sponsored_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create sponsored content for their items" 
ON public.sponsored_content 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their sponsored content" 
ON public.sponsored_content 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their sponsored content" 
ON public.sponsored_content 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sponsored content" 
ON public.sponsored_content 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sponsored content status" 
ON public.sponsored_content 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Create functions for content moderation
CREATE OR REPLACE FUNCTION public.get_flagged_content_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  flagged_count INTEGER;
BEGIN
  SELECT COUNT(*)::integer INTO flagged_count
  FROM public.content_reports
  WHERE status = 'pending';
  
  RETURN COALESCE(flagged_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sponsored_content_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sponsored_count INTEGER;
BEGIN
  SELECT COUNT(*)::integer INTO sponsored_count
  FROM public.sponsored_content
  WHERE status = 'active' AND end_date > now();
  
  RETURN COALESCE(sponsored_count, 0);
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_content_reports_updated_at
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsored_content_updated_at
  BEFORE UPDATE ON public.sponsored_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();