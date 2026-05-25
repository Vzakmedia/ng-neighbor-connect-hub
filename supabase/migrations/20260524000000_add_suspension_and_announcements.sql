-- Add suspension fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended  BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspended_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Index for fast queries on suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended) WHERE is_suspended = TRUE;

-- Platform-wide announcements table
CREATE TABLE IF NOT EXISTS platform_announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID        NOT NULL REFERENCES profiles(user_id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  priority    TEXT        NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_roles TEXT[]     DEFAULT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NULL
);

-- RLS: admins can insert/select; authenticated users can read non-expired, non-targeted rows
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage announcements"
  ON platform_announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can read their announcements"
  ON platform_announcements
  FOR SELECT
  USING (
    (expires_at IS NULL OR expires_at > NOW())
    AND (
      target_roles IS NULL
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
          AND role::text = ANY(target_roles)
      )
    )
  );
