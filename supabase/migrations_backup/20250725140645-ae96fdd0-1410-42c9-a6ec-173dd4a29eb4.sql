-- Add missing foreign key relationships for tables with profiles
-- These are needed for the joins that are failing in the queries

-- Add foreign key for panic_alerts to profiles
ALTER TABLE panic_alerts 
ADD CONSTRAINT panic_alerts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key for safety_alerts to profiles  
ALTER TABLE safety_alerts
ADD CONSTRAINT safety_alerts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;