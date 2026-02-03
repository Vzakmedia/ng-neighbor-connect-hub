-- Fix the security definer function with proper search path
CREATE OR REPLACE FUNCTION update_board_post_edited_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content != NEW.content THEN
        NEW.edited_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;