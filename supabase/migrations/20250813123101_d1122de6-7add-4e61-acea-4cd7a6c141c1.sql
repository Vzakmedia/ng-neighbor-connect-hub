-- Phase 1: Critical Security Fixes

-- 1. Fix Chat Messages Privacy - Remove public access, implement group-based access
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can view all chat messages'
  ) THEN
    DROP POLICY "Users can view all chat messages" ON public.chat_messages;
  END IF;
END $$;

-- Add proper chat message access control - users can only see messages in groups they belong to
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can view messages in their groups'
  ) THEN
    CREATE POLICY "Users can view messages in their groups"
    ON public.chat_messages
    FOR SELECT
    USING (
      -- For now, users can only see their own messages until proper group membership is implemented
      auth.uid() = user_id
    );
  END IF;
END $$;

-- 2. Fix Messaging Preferences Privacy - Remove public access
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'messaging_preferences' AND policyname = 'Users can view all messaging preferences'
  ) THEN
    DROP POLICY "Users can view all messaging preferences" ON public.messaging_preferences;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'messaging_preferences' AND policyname = 'Users can view their own messaging preferences'
  ) THEN
    CREATE POLICY "Users can view their own messaging preferences"
    ON public.messaging_preferences
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Restrict Service Weekly Availability Access - Only authenticated users can view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_weekly_availability' AND policyname = 'Service availability is public'
  ) THEN
    DROP POLICY "Service availability is public" ON public.service_weekly_availability;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_weekly_availability' AND policyname = 'Authenticated users can view service availability'
  ) THEN
    CREATE POLICY "Authenticated users can view service availability"
    ON public.service_weekly_availability
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;