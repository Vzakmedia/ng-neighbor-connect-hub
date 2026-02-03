-- Fix the handle_new_user function to prevent duplicate profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only insert profile if it doesn't already exist
  INSERT INTO public.profiles (user_id, full_name, phone, state, city, neighborhood, address, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'state',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'neighborhood',
    new.raw_user_meta_data ->> 'address',
    new.email
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate key error
  
  -- Assign default user role only if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;