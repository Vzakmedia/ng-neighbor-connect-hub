UPDATE storage.buckets
SET public = false
WHERE id = 'chat-attachments';

DROP POLICY IF EXISTS "Users can view chat attachments" ON storage.objects;

CREATE POLICY "Conversation participants can view chat attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.direct_messages dm
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(dm.attachments, '[]'::jsonb)) AS attachment
      WHERE (dm.sender_id = auth.uid() OR dm.recipient_id = auth.uid())
        AND (
          attachment->>'id' = storage.objects.name
          OR attachment->>'storagePath' = storage.objects.name
        )
    )
  )
);
