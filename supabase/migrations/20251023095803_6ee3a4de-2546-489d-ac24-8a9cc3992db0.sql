-- Add first_login_completed column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_login_completed BOOLEAN DEFAULT FALSE;

-- Update existing profiles to true (they've already logged in before)
UPDATE profiles SET first_login_completed = TRUE WHERE first_login_completed IS FALSE;