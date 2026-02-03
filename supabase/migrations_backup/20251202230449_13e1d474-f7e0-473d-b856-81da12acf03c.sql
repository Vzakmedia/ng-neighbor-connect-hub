-- Update create_conversation_with_request_check to enforce allow_messages setting
CREATE OR REPLACE FUNCTION public.create_conversation_with_request_check(
  target_user_id UUID
)
RETURNS TABLE (
  conversation_id UUID,
  is_new BOOLEAN,
  status TEXT,
  request_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_existing_conversation UUID;
  v_is_new BOOLEAN := false;
  v_status TEXT := 'active';
  v_request_id UUID := NULL;
  v_allow_messages BOOLEAN := true;
BEGIN
  -- Get the current user ID
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF v_current_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Check if target user allows messages
  SELECT COALESCE(mp.allow_messages, true) INTO v_allow_messages
  FROM messaging_preferences mp
  WHERE mp.user_id = target_user_id;

  -- If target user has disabled messages, raise an error
  IF v_allow_messages = false THEN
    RAISE EXCEPTION 'This user has disabled direct messages';
  END IF;

  -- Check for existing conversation
  SELECT dc.id INTO v_existing_conversation
  FROM direct_conversations dc
  WHERE (dc.participant_one = v_current_user_id AND dc.participant_two = target_user_id)
     OR (dc.participant_one = target_user_id AND dc.participant_two = v_current_user_id);
  
  IF v_existing_conversation IS NOT NULL THEN
    -- Return existing conversation
    RETURN QUERY SELECT v_existing_conversation, false, 'active'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if there's a pending request
  SELECT ecr.id INTO v_request_id
  FROM emergency_contact_requests ecr
  WHERE ecr.requester_id = v_current_user_id 
    AND ecr.target_user_id = create_conversation_with_request_check.target_user_id
    AND ecr.status = 'pending';
  
  IF v_request_id IS NOT NULL THEN
    -- Return pending status
    RETURN QUERY SELECT NULL::UUID, false, 'pending'::TEXT, v_request_id;
    RETURN;
  END IF;
  
  -- Create new conversation
  INSERT INTO direct_conversations (participant_one, participant_two)
  VALUES (v_current_user_id, target_user_id)
  RETURNING id INTO v_existing_conversation;
  
  v_is_new := true;
  
  RETURN QUERY SELECT v_existing_conversation, v_is_new, 'active'::TEXT, NULL::UUID;
END;
$$;

-- Add comment to explain the function
COMMENT ON FUNCTION public.create_conversation_with_request_check(UUID) IS 
'Creates or retrieves a conversation with the target user, enforcing allow_messages preference';
