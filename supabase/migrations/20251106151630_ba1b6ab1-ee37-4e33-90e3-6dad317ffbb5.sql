-- Create saved marketplace items table
CREATE TABLE public.saved_marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(user_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_marketplace_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved items"
ON public.saved_marketplace_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save items"
ON public.saved_marketplace_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved items"
ON public.saved_marketplace_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_saved_marketplace_items_user_id ON public.saved_marketplace_items(user_id);
CREATE INDEX idx_saved_marketplace_items_item_id ON public.saved_marketplace_items(item_id);