-- Create board_join_requests table
CREATE TABLE public.board_join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(board_id, user_id)
);

-- Enable RLS
ALTER TABLE public.board_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_join_requests
CREATE POLICY "Users can create join requests for public boards"
ON public.board_join_requests
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM discussion_boards 
    WHERE id = board_id AND is_public = true
  )
);

CREATE POLICY "Users can view their own join requests"
ON public.board_join_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Board admins can view join requests for their boards"
ON public.board_join_requests
FOR SELECT
USING (
  is_board_creator(board_id, auth.uid()) OR 
  is_board_admin(board_id, auth.uid())
);

CREATE POLICY "Board admins can update join requests"
ON public.board_join_requests
FOR UPDATE
USING (
  is_board_creator(board_id, auth.uid()) OR 
  is_board_admin(board_id, auth.uid())
);

-- Function to automatically add approved users to board_members
CREATE OR REPLACE FUNCTION public.handle_join_request_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If request was approved, add user to board_members
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO public.board_members (board_id, user_id, role)
    VALUES (NEW.board_id, NEW.user_id, 'member')
    ON CONFLICT (board_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for join request approval
CREATE TRIGGER trigger_join_request_approval
  AFTER UPDATE ON public.board_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_join_request_approval();

-- Add unique constraint to board_members to prevent duplicates
ALTER TABLE public.board_members 
ADD CONSTRAINT unique_board_user UNIQUE (board_id, user_id);