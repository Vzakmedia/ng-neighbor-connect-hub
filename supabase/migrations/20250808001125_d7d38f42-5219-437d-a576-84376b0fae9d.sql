-- Create user_devices table to store push notification tokens
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  fcm_token TEXT UNIQUE,
  apns_token TEXT UNIQUE,
  device_model TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_platform ON public.user_devices(platform);

-- Basic RLS policies
DO $$ BEGIN
  -- Users can view their own devices
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_devices' AND policyname = 'Users can view their own devices'
  ) THEN
    CREATE POLICY "Users can view their own devices"
    ON public.user_devices
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own devices
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_devices' AND policyname = 'Users can insert their own devices'
  ) THEN
    CREATE POLICY "Users can insert their own devices"
    ON public.user_devices
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own devices
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_devices' AND policyname = 'Users can update their own devices'
  ) THEN
    CREATE POLICY "Users can update their own devices"
    ON public.user_devices
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  -- Users can delete their own devices (optional)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_devices' AND policyname = 'Users can delete their own devices'
  ) THEN
    CREATE POLICY "Users can delete their own devices"
    ON public.user_devices
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_user_devices()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_set_updated_at_user_devices ON public.user_devices;
CREATE TRIGGER trg_set_updated_at_user_devices
BEFORE UPDATE ON public.user_devices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_user_devices();

-- RPC function to register device tokens
CREATE OR REPLACE FUNCTION public.register_user_device(
  platform TEXT,
  fcm_token TEXT,
  apns_token TEXT,
  device_model TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_device_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prefer APNS if provided
  IF apns_token IS NOT NULL AND length(btrim(apns_token)) > 0 THEN
    INSERT INTO public.user_devices (user_id, platform, apns_token, device_model, last_active_at)
    VALUES (v_user_id, 'ios', btrim(apns_token), device_model, now())
    ON CONFLICT (apns_token) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      platform = EXCLUDED.platform,
      device_model = EXCLUDED.device_model,
      last_active_at = now(),
      updated_at = now(),
      is_active = true
    RETURNING id INTO v_device_id;

    RETURN v_device_id;
  END IF;

  -- Otherwise use FCM if provided
  IF fcm_token IS NOT NULL AND length(btrim(fcm_token)) > 0 THEN
    INSERT INTO public.user_devices (user_id, platform, fcm_token, device_model, last_active_at)
    VALUES (v_user_id, 'android', btrim(fcm_token), device_model, now())
    ON CONFLICT (fcm_token) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      platform = EXCLUDED.platform,
      device_model = EXCLUDED.device_model,
      last_active_at = now(),
      updated_at = now(),
      is_active = true
    RETURNING id INTO v_device_id;

    RETURN v_device_id;
  END IF;

  -- Fallback: record a web device without token
  INSERT INTO public.user_devices (user_id, platform, device_model, last_active_at)
  VALUES (v_user_id, COALESCE(NULLIF(btrim(platform), ''), 'web'), device_model, now())
  RETURNING id INTO v_device_id;

  RETURN v_device_id;
END; $$;