-- Create likes table for marketplace items
CREATE TABLE public.marketplace_item_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Create likes table for services
CREATE TABLE public.service_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Enable Row Level Security
ALTER TABLE public.marketplace_item_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace_item_likes
CREATE POLICY "Users can view all marketplace item likes" 
ON public.marketplace_item_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own marketplace item likes" 
ON public.marketplace_item_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketplace item likes" 
ON public.marketplace_item_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for service_likes
CREATE POLICY "Users can view all service likes" 
ON public.service_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own service likes" 
ON public.service_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service likes" 
ON public.service_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_marketplace_item_likes_item_id ON public.marketplace_item_likes(item_id);
CREATE INDEX idx_marketplace_item_likes_user_id ON public.marketplace_item_likes(user_id);
CREATE INDEX idx_service_likes_service_id ON public.service_likes(service_id);
CREATE INDEX idx_service_likes_user_id ON public.service_likes(user_id);