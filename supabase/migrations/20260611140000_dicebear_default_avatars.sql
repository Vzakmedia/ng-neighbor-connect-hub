-- Give every user a DiceBear avatar by default instead of initials.
--
-- avatar_url is populated at profile creation: OAuth-provided avatars are
-- kept; everyone else gets a deterministic DiceBear avatar seeded by their
-- user id (matches src/lib/dicebear.ts getDiceBearUrl defaults). Because the
-- value lives in profiles.avatar_url, every surface that renders avatars
-- picks it up without client changes. Uploading a real photo simply
-- overwrites it.

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
    COALESCE(
      NULLIF(new.raw_user_meta_data ->> 'avatar_url', ''),
      'https://api.dicebear.com/9.x/avataaars/svg?seed=' || new.id::text
    )
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate key error

  -- Assign default user role only if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

-- Backfill: existing users who never uploaded an avatar get one too.
UPDATE public.profiles
SET avatar_url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=' || user_id::text
WHERE avatar_url IS NULL OR avatar_url = '';
