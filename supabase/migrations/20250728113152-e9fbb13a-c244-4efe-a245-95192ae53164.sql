-- First, let's clean up the duplicate records by keeping only the most recent one
DELETE FROM emergency_preferences 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM emergency_preferences 
  ORDER BY user_id, created_at DESC
);

-- Then add a unique constraint on user_id to prevent future duplicates
ALTER TABLE emergency_preferences 
ADD CONSTRAINT emergency_preferences_user_id_key UNIQUE (user_id);