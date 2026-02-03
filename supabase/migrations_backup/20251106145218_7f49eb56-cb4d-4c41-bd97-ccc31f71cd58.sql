-- Create marketplace item comments table
CREATE TABLE IF NOT EXISTS public.marketplace_item_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.marketplace_item_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view comments on items"
ON public.marketplace_item_comments
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.marketplace_item_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.marketplace_item_comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.marketplace_item_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_marketplace_item_comments_item_id ON public.marketplace_item_comments(item_id);
CREATE INDEX idx_marketplace_item_comments_user_id ON public.marketplace_item_comments(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_marketplace_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_marketplace_item_comments_timestamp
BEFORE UPDATE ON public.marketplace_item_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_marketplace_comment_timestamp();