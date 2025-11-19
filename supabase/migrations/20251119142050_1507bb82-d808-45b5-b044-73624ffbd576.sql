-- Add RLS policy to allow users to view profiles of conversation participants
CREATE POLICY "Users can view profiles of conversation participants"
ON profiles
FOR SELECT
TO public
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() <> user_id 
  AND EXISTS (
    SELECT 1 
    FROM direct_conversations dc 
    WHERE (
      (dc.user1_id = auth.uid() AND dc.user2_id = profiles.user_id)
      OR 
      (dc.user2_id = auth.uid() AND dc.user1_id = profiles.user_id)
    )
  )
);