-- Add payment tracking fields to promotion_campaigns table
ALTER TABLE public.promotion_campaigns 
ADD COLUMN payment_session_id TEXT,
ADD COLUMN payment_amount DECIMAL(10,2),
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN payment_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for payment session lookups
CREATE INDEX idx_promotion_campaigns_payment_session ON public.promotion_campaigns(payment_session_id);

-- Update RLS policies to allow system updates for payment processing
CREATE POLICY "System can update payment status" 
ON public.promotion_campaigns 
FOR UPDATE 
USING (true);