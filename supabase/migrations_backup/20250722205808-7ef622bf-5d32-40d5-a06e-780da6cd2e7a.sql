-- Create messaging tables with different names to avoid conflicts
CREATE TYPE direct_message_status AS ENUM ('sent', 'delivered', 'read');

-- Messages table for direct messaging
CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status direct_message_status DEFAULT 'sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false
);

-- Direct conversation tracking table to help organize conversations between users
CREATE TABLE public.direct_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user1_has_unread BOOLEAN DEFAULT false,
    user2_has_unread BOOLEAN DEFAULT false,
    UNIQUE(user1_id, user2_id)
);

-- User messaging preferences
CREATE TABLE public.messaging_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    allow_messages BOOLEAN DEFAULT true,
    show_read_receipts BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add row level security policies
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_preferences ENABLE ROW LEVEL SECURITY;

-- RLS for direct_messages
CREATE POLICY "Users can view messages they sent or received"
ON public.direct_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.direct_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they sent"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = sender_id);

-- RLS for direct_conversations
CREATE POLICY "Users can view their direct conversations"
ON public.direct_conversations
FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create direct conversations"
ON public.direct_conversations
FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their direct conversations"
ON public.direct_conversations
FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS for messaging_preferences
CREATE POLICY "Users can view all messaging preferences"
ON public.messaging_preferences
FOR SELECT
USING (true);

CREATE POLICY "Users can update their messaging preferences"
ON public.messaging_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their messaging preferences"
ON public.messaging_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to update conversation last_message_at and unread status
CREATE OR REPLACE FUNCTION public.update_direct_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    conv_record RECORD;
BEGIN
    -- Get or create conversation
    SELECT * INTO conv_record FROM public.direct_conversations 
    WHERE (user1_id = NEW.sender_id AND user2_id = NEW.recipient_id) 
       OR (user1_id = NEW.recipient_id AND user2_id = NEW.sender_id);
    
    IF NOT FOUND THEN
        -- Create new conversation if it doesn't exist
        INSERT INTO public.direct_conversations (user1_id, user2_id, last_message_at, user1_has_unread, user2_has_unread)
        VALUES (NEW.sender_id, NEW.recipient_id, now(), false, true);
    ELSE
        -- Update existing conversation
        UPDATE public.direct_conversations
        SET 
            last_message_at = now(),
            user1_has_unread = CASE 
                                WHEN user1_id = NEW.recipient_id THEN true
                                ELSE user1_has_unread
                               END,
            user2_has_unread = CASE 
                                WHEN user2_id = NEW.recipient_id THEN true
                                ELSE user2_has_unread
                               END
        WHERE id = conv_record.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for direct_messages
CREATE TRIGGER update_direct_conversation_on_new_message
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_direct_conversation_on_message();

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_direct_messages_updated_at
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_direct_conversations_updated_at
BEFORE UPDATE ON public.direct_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messaging_preferences_updated_at
BEFORE UPDATE ON public.messaging_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime capability to tables
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_conversations REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_conversations;

-- Create indexes for better performance
CREATE INDEX idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient_id ON public.direct_messages(recipient_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at);
CREATE INDEX idx_direct_conversations_user1_id ON public.direct_conversations(user1_id);
CREATE INDEX idx_direct_conversations_user2_id ON public.direct_conversations(user2_id);
CREATE INDEX idx_direct_conversations_last_message_at ON public.direct_conversations(last_message_at);

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_direct_messages_as_read(conversation_id UUID, current_user_id UUID)
RETURNS void AS $$
DECLARE
    conv_record RECORD;
BEGIN
    -- Get conversation
    SELECT * INTO conv_record FROM public.direct_conversations WHERE id = conversation_id;
    
    -- Update message status
    UPDATE public.direct_messages
    SET status = 'read'
    WHERE recipient_id = current_user_id
    AND (
        (sender_id = conv_record.user1_id AND recipient_id = conv_record.user2_id)
        OR
        (sender_id = conv_record.user2_id AND recipient_id = conv_record.user1_id)
    )
    AND status != 'read';
    
    -- Update conversation unread status
    UPDATE public.direct_conversations
    SET 
        user1_has_unread = CASE WHEN user1_id = current_user_id THEN false ELSE user1_has_unread END,
        user2_has_unread = CASE WHEN user2_id = current_user_id THEN false ELSE user2_has_unread END
    WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user allows messages (new version)
CREATE OR REPLACE FUNCTION public.user_allows_direct_messages(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    allows_messages BOOLEAN;
BEGIN
    SELECT 
        COALESCE(mp.allow_messages, true) INTO allows_messages
    FROM 
        auth.users u
    LEFT JOIN 
        public.messaging_preferences mp ON u.id = mp.user_id
    WHERE 
        u.id = user_id;
    
    RETURN allows_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default messaging preferences for existing users
INSERT INTO public.messaging_preferences (user_id, allow_messages, show_read_receipts, show_online_status)
SELECT id, true, true, true
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Add messaging preferences for new users trigger
DROP TRIGGER IF EXISTS on_auth_user_created_messaging ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user_messaging_prefs()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.messaging_preferences (user_id, allow_messages, show_read_receipts, show_online_status)
    VALUES (NEW.id, true, true, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add messaging preferences when a new user is created
CREATE TRIGGER on_auth_user_created_messaging_new
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_messaging_prefs();