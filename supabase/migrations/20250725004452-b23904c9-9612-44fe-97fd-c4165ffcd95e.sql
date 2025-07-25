-- Fix function search path security warnings
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';