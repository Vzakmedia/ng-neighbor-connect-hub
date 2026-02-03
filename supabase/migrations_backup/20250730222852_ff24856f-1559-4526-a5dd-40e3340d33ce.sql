-- Add approval status to services table
ALTER TABLE public.services 
ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.services 
ADD COLUMN approved_by uuid REFERENCES auth.users(id);

ALTER TABLE public.services 
ADD COLUMN approved_at timestamp with time zone;

ALTER TABLE public.services 
ADD COLUMN rejection_reason text;

-- Add approval status to marketplace_items table  
ALTER TABLE public.marketplace_items 
ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.marketplace_items 
ADD COLUMN approved_by uuid REFERENCES auth.users(id);

ALTER TABLE public.marketplace_items 
ADD COLUMN approved_at timestamp with time zone;

ALTER TABLE public.marketplace_items 
ADD COLUMN rejection_reason text;

-- Update RLS policies for services to only show approved items to regular users
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;

CREATE POLICY "Anyone can view approved active services" ON public.services
FOR SELECT USING (
  approval_status = 'approved' AND status = 'active'
);

CREATE POLICY "Admins can view all services" ON public.services
FOR SELECT USING (
  has_staff_permission(auth.uid(), 'content_moderation', 'read')
);

CREATE POLICY "Users can view their own services" ON public.services
FOR SELECT USING (auth.uid() = user_id);

-- Update RLS policies for marketplace_items to only show approved items to regular users
DROP POLICY IF EXISTS "Anyone can view active items" ON public.marketplace_items;

CREATE POLICY "Anyone can view approved active items" ON public.marketplace_items
FOR SELECT USING (
  approval_status = 'approved' AND status = 'active'
);

CREATE POLICY "Admins can view all marketplace items" ON public.marketplace_items
FOR SELECT USING (
  has_staff_permission(auth.uid(), 'content_moderation', 'read')
);

CREATE POLICY "Users can view their own marketplace items" ON public.marketplace_items
FOR SELECT USING (auth.uid() = user_id);

-- Add policies for admins to approve/reject items
CREATE POLICY "Admins can update service approval status" ON public.services
FOR UPDATE USING (
  has_staff_permission(auth.uid(), 'content_moderation', 'write')
);

CREATE POLICY "Admins can update marketplace item approval status" ON public.marketplace_items
FOR UPDATE USING (
  has_staff_permission(auth.uid(), 'content_moderation', 'write')
);

-- Function to approve/reject services
CREATE OR REPLACE FUNCTION public.approve_service(
  _service_id uuid,
  _approval_status text,
  _rejection_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has permission
  IF NOT has_staff_permission(auth.uid(), 'content_moderation', 'write') THEN
    RAISE EXCEPTION 'Insufficient permissions to moderate content';
  END IF;
  
  -- Update service approval status
  UPDATE public.services
  SET 
    approval_status = _approval_status,
    approved_by = CASE WHEN _approval_status = 'approved' THEN auth.uid() ELSE NULL END,
    approved_at = CASE WHEN _approval_status = 'approved' THEN now() ELSE NULL END,
    rejection_reason = _rejection_reason
  WHERE id = _service_id;
  
  -- Log the action
  PERFORM log_staff_activity(
    'moderate_service',
    'service',
    _service_id,
    jsonb_build_object('approval_status', _approval_status, 'rejection_reason', _rejection_reason)
  );
  
  RETURN true;
END;
$$;

-- Function to approve/reject marketplace items
CREATE OR REPLACE FUNCTION public.approve_marketplace_item(
  _item_id uuid,
  _approval_status text,
  _rejection_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has permission
  IF NOT has_staff_permission(auth.uid(), 'content_moderation', 'write') THEN
    RAISE EXCEPTION 'Insufficient permissions to moderate content';
  END IF;
  
  -- Update item approval status
  UPDATE public.marketplace_items
  SET 
    approval_status = _approval_status,
    approved_by = CASE WHEN _approval_status = 'approved' THEN auth.uid() ELSE NULL END,
    approved_at = CASE WHEN _approval_status = 'approved' THEN now() ELSE NULL END,
    rejection_reason = _rejection_reason
  WHERE id = _item_id;
  
  -- Log the action
  PERFORM log_staff_activity(
    'moderate_marketplace_item',
    'marketplace_item',
    _item_id,
    jsonb_build_object('approval_status', _approval_status, 'rejection_reason', _rejection_reason)
  );
  
  RETURN true;
END;
$$;