-- Check current foreign key relationships and fix the marketplace_items table
-- First, let's see what foreign keys exist for marketplace_items
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='marketplace_items';

-- Fix the foreign key relationship to point to profiles table instead of auth.users
-- First drop the existing foreign key constraint if it exists
ALTER TABLE marketplace_items 
DROP CONSTRAINT IF EXISTS marketplace_items_user_id_fkey;

-- Add the correct foreign key constraint to profiles table
ALTER TABLE marketplace_items 
ADD CONSTRAINT marketplace_items_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;