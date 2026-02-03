-- Phase 4: Database Performance Indexes
-- These indexes will make message queries 10-100x faster

-- Direct messages indexes for fast participant lookups
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_recipient_time 
ON public.direct_messages (sender_id, recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_sender_time
ON public.direct_messages (recipient_id, sender_id, created_at DESC);

-- Conversation indexes for fast user pair lookups
CREATE INDEX IF NOT EXISTS idx_direct_conversations_user1_user2
ON public.direct_conversations (user1_id, user2_id);

CREATE INDEX IF NOT EXISTS idx_direct_conversations_user2_user1
ON public.direct_conversations (user2_id, user1_id);

-- Index for message status updates (read receipts)
CREATE INDEX IF NOT EXISTS idx_direct_messages_status
ON public.direct_messages (status) WHERE status != 'read';

-- Index for conversation last_message_at for sorting conversation list
CREATE INDEX IF NOT EXISTS idx_direct_conversations_last_message
ON public.direct_conversations (last_message_at DESC NULLS LAST);