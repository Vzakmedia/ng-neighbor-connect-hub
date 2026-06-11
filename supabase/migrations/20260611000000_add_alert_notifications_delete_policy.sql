-- Notifications marked as deleted by a user were reappearing after sign-in
-- because alert_notifications had no DELETE policy, so deletes silently
-- affected 0 rows under RLS.
CREATE POLICY "Users can delete their own notifications" ON public.alert_notifications
  FOR DELETE USING (auth.uid() = recipient_id);
