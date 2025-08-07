-- Fix security warnings: Update functions with proper search_path

-- Fix function: has_role (if it exists without search_path)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Fix function: handle_new_user (update search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only insert profile if it doesn't already exist
  INSERT INTO public.profiles (user_id, full_name, phone, state, city, neighborhood, address, email, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'state',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'neighborhood',
    new.raw_user_meta_data ->> 'address',
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate key error
  
  -- Assign default user role only if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;