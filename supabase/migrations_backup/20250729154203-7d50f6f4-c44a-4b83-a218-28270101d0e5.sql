-- Create service_reviews table for ratings and reviews on services (if not exists)
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, reviewer_id)
);

-- Create marketplace_reviews table for ratings and reviews on marketplace items (if not exists)
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, reviewer_id)
);

-- Create service_comments table for comments on services (if not exists)
CREATE TABLE IF NOT EXISTS public.service_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  commenter_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace_comments table for comments on marketplace items (if not exists)
CREATE TABLE IF NOT EXISTS public.marketplace_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  commenter_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace_inquiries table for marketplace item inquiries (if not exists)
CREATE TABLE IF NOT EXISTS public.marketplace_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  inquiry_type TEXT NOT NULL DEFAULT 'purchase' CHECK (inquiry_type IN ('purchase', 'question', 'offer')),
  message TEXT NOT NULL,
  offer_amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create review_reports table for reporting inappropriate reviews/comments (if not exists)
CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('service_review', 'marketplace_review', 'service_comment', 'marketplace_comment')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Anyone can view service reviews" ON public.service_reviews;
DROP POLICY IF EXISTS "Users can create reviews for services they didn't create" ON public.service_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.service_reviews;
DROP POLICY IF EXISTS "Admins can manage all service reviews" ON public.service_reviews;

-- RLS Policies for service_reviews
CREATE POLICY "Anyone can view service reviews" ON public.service_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for services they didn't create" ON public.service_reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND 
  NOT EXISTS (SELECT 1 FROM public.services WHERE id = service_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their own reviews" ON public.service_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Admins can manage all service reviews" ON public.service_reviews FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for marketplace_reviews
DROP POLICY IF EXISTS "Anyone can view marketplace reviews" ON public.marketplace_reviews;
DROP POLICY IF EXISTS "Users can create reviews for items they didn't create" ON public.marketplace_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.marketplace_reviews;
DROP POLICY IF EXISTS "Admins can manage all marketplace reviews" ON public.marketplace_reviews;

CREATE POLICY "Anyone can view marketplace reviews" ON public.marketplace_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for items they didn't create" ON public.marketplace_reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND 
  NOT EXISTS (SELECT 1 FROM public.marketplace_items WHERE id = item_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their own reviews" ON public.marketplace_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Admins can manage all marketplace reviews" ON public.marketplace_reviews FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for service_comments
DROP POLICY IF EXISTS "Anyone can view service comments" ON public.service_comments;
DROP POLICY IF EXISTS "Users can create service comments" ON public.service_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.service_comments;
DROP POLICY IF EXISTS "Admins can manage all service comments" ON public.service_comments;

CREATE POLICY "Anyone can view service comments" ON public.service_comments FOR SELECT USING (true);
CREATE POLICY "Users can create service comments" ON public.service_comments FOR INSERT WITH CHECK (auth.uid() = commenter_id);
CREATE POLICY "Users can update their own comments" ON public.service_comments FOR UPDATE USING (auth.uid() = commenter_id);
CREATE POLICY "Admins can manage all service comments" ON public.service_comments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for marketplace_comments
DROP POLICY IF EXISTS "Anyone can view marketplace comments" ON public.marketplace_comments;
DROP POLICY IF EXISTS "Users can create marketplace comments" ON public.marketplace_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.marketplace_comments;
DROP POLICY IF EXISTS "Admins can manage all marketplace comments" ON public.marketplace_comments;

CREATE POLICY "Anyone can view marketplace comments" ON public.marketplace_comments FOR SELECT USING (true);
CREATE POLICY "Users can create marketplace comments" ON public.marketplace_comments FOR INSERT WITH CHECK (auth.uid() = commenter_id);
CREATE POLICY "Users can update their own comments" ON public.marketplace_comments FOR UPDATE USING (auth.uid() = commenter_id);
CREATE POLICY "Admins can manage all marketplace comments" ON public.marketplace_comments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for marketplace_inquiries
DROP POLICY IF EXISTS "Users can view their own inquiries" ON public.marketplace_inquiries;
DROP POLICY IF EXISTS "Users can create inquiries" ON public.marketplace_inquiries;
DROP POLICY IF EXISTS "Sellers can update inquiry status" ON public.marketplace_inquiries;
DROP POLICY IF EXISTS "Admins can manage all inquiries" ON public.marketplace_inquiries;

CREATE POLICY "Users can view their own inquiries" ON public.marketplace_inquiries FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can create inquiries" ON public.marketplace_inquiries FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update inquiry status" ON public.marketplace_inquiries FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);
CREATE POLICY "Admins can manage all inquiries" ON public.marketplace_inquiries FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for review_reports
DROP POLICY IF EXISTS "Users can view their own reports" ON public.review_reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.review_reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON public.review_reports;

CREATE POLICY "Users can view their own reports" ON public.review_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON public.review_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage all reports" ON public.review_reports FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id ON public.service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_reviewer_id ON public.service_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_item_id ON public.marketplace_reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_reviewer_id ON public.marketplace_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_service_comments_service_id ON public.service_comments(service_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_item_id ON public.marketplace_comments(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_inquiries_item_id ON public.marketplace_inquiries(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_inquiries_buyer_id ON public.marketplace_inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_content_type_id ON public.review_reports(content_type, content_id);

-- Add rating and review count columns to existing tables if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'rating') THEN
    ALTER TABLE public.services ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'total_reviews') THEN
    ALTER TABLE public.services ADD COLUMN total_reviews INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_items' AND column_name = 'rating') THEN
    ALTER TABLE public.marketplace_items ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_items' AND column_name = 'total_reviews') THEN
    ALTER TABLE public.marketplace_items ADD COLUMN total_reviews INTEGER DEFAULT 0;
  END IF;
END $$;

-- Function to update service ratings automatically
CREATE OR REPLACE FUNCTION public.update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.services 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM public.service_reviews 
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.service_reviews 
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id)
    )
  WHERE id = COALESCE(NEW.service_id, OLD.service_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update marketplace item ratings automatically
CREATE OR REPLACE FUNCTION public.update_marketplace_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.marketplace_items 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM public.marketplace_reviews 
      WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.marketplace_reviews 
      WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
    )
  WHERE id = COALESCE(NEW.item_id, OLD.item_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update ratings
DROP TRIGGER IF EXISTS update_service_rating_trigger ON public.service_reviews;
CREATE TRIGGER update_service_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_rating();

DROP TRIGGER IF EXISTS update_marketplace_rating_trigger ON public.marketplace_reviews;
CREATE TRIGGER update_marketplace_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_rating();