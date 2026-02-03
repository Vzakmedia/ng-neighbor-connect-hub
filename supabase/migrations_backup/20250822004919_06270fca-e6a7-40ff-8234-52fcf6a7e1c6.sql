-- Enhanced Discussion Boards System Migration (Fixed)
-- Adding roles, invites, privacy, reactions, threads, search, and location features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add new columns to discussion_boards for privacy and location features
ALTER TABLE public.discussion_boards 
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS discoverable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS location_scope text DEFAULT 'global',
ADD COLUMN IF NOT EXISTS location_name text;

-- Add status column to board_members for better member management
ALTER TABLE public.board_members 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add new columns to board_posts for threading and pinning
ALTER TABLE public.board_posts 
ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES public.board_posts(id),
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Update is_pinned to be more explicit (already exists but ensuring it's there)
ALTER TABLE public.board_posts 
ALTER COLUMN is_pinned SET DEFAULT false;

-- Create group_invites table
CREATE TABLE IF NOT EXISTS public.group_invites (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id uuid NOT NULL REFERENCES public.discussion_boards(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
    expires_at timestamp with time zone,
    max_uses integer,
    uses integer DEFAULT 0,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    is_active boolean DEFAULT true
);

-- Create message_reactions table for board posts
CREATE TABLE IF NOT EXISTS public.board_post_reactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES public.board_posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    reaction text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id, reaction)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_board_posts_parent_message_id ON public.board_posts(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_content_search ON public.board_posts USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_group_invites_token ON public.group_invites(token);
CREATE INDEX IF NOT EXISTS idx_group_invites_board_id ON public.group_invites(board_id);
CREATE INDEX IF NOT EXISTS idx_board_post_reactions_post_id ON public.board_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_board_members_status ON public.board_members(status);

-- Enable RLS on new tables
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_post_reactions ENABLE ROW LEVEL SECURITY;

-- Function to validate and consume invite links
CREATE OR REPLACE FUNCTION public.consume_invite_link(invite_token text, joining_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invite_record RECORD;
    board_record RECORD;
BEGIN
    -- Find the invite
    SELECT * INTO invite_record
    FROM public.group_invites
    WHERE token = invite_token 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses < max_uses);
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get board info
    SELECT * INTO board_record
    FROM public.discussion_boards
    WHERE id = invite_record.board_id;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.board_members
        WHERE board_id = invite_record.board_id AND user_id = joining_user_id
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Add user to board
    INSERT INTO public.board_members (board_id, user_id, role)
    VALUES (invite_record.board_id, joining_user_id, 'member');
    
    -- Increment usage count
    UPDATE public.group_invites
    SET uses = uses + 1
    WHERE id = invite_record.id;
    
    -- Deactivate if max uses reached
    IF invite_record.max_uses IS NOT NULL AND (invite_record.uses + 1) >= invite_record.max_uses THEN
        UPDATE public.group_invites
        SET is_active = false
        WHERE id = invite_record.id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Drop existing policies that conflict
DROP POLICY IF EXISTS "Board admins can manage invite links" ON public.group_invites;
DROP POLICY IF EXISTS "Users can view active invite links for discovery" ON public.group_invites;
DROP POLICY IF EXISTS "Board members can view reactions" ON public.board_post_reactions;
DROP POLICY IF EXISTS "Board members can add reactions" ON public.board_post_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.board_post_reactions;

-- RLS Policies for group_invites
CREATE POLICY "Board admins can manage invite links"
ON public.group_invites
FOR ALL
USING (
    public.is_board_creator(board_id, auth.uid()) OR
    public.is_board_admin(board_id, auth.uid())
);

CREATE POLICY "Users can view active invite links for discovery"
ON public.group_invites
FOR SELECT
USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (
        SELECT 1 FROM public.discussion_boards
        WHERE id = board_id AND discoverable = true AND is_public = true
    )
);

-- RLS Policies for board_post_reactions
CREATE POLICY "Board members can view reactions"
ON public.board_post_reactions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.board_posts bp
        JOIN public.board_members bm ON bp.board_id = bm.board_id
        WHERE bp.id = board_post_reactions.post_id 
        AND bm.user_id = auth.uid()
        AND bm.status = 'active'
    )
);

CREATE POLICY "Board members can add reactions"
ON public.board_post_reactions
FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.board_posts bp
        JOIN public.board_members bm ON bp.board_id = bm.board_id
        WHERE bp.id = board_post_reactions.post_id 
        AND bm.user_id = auth.uid()
        AND bm.status = 'active'
    )
);

CREATE POLICY "Users can remove their own reactions"
ON public.board_post_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Update existing RLS policies for enhanced privacy
DROP POLICY IF EXISTS "Public boards are viewable by everyone" ON public.discussion_boards;
DROP POLICY IF EXISTS "Discoverable public boards are viewable by everyone" ON public.discussion_boards;
DROP POLICY IF EXISTS "Private boards are only viewable by members" ON public.discussion_boards;

CREATE POLICY "Discoverable public boards are viewable by everyone"
ON public.discussion_boards
FOR SELECT
USING (is_public = true AND discoverable = true);

CREATE POLICY "Private boards are only viewable by members"
ON public.discussion_boards
FOR SELECT
USING (
    (is_private = false AND discoverable = true) OR
    public.is_board_member(id, auth.uid()) OR
    creator_id = auth.uid()
);

-- Update board_posts policies for approval workflow
DROP POLICY IF EXISTS "Board members can view posts" ON public.board_posts;
DROP POLICY IF EXISTS "Users can view approved board posts" ON public.board_posts;
DROP POLICY IF EXISTS "Board moderators can update post approval status" ON public.board_posts;

CREATE POLICY "Users can view approved board posts"
ON public.board_posts
FOR SELECT
USING (
    (approval_status = 'approved' AND EXISTS (
        SELECT 1 FROM public.discussion_boards
        WHERE id = board_posts.board_id AND is_public = true
    )) OR
    (EXISTS (
        SELECT 1 FROM public.board_members
        WHERE board_id = board_posts.board_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    ) AND (
        approval_status = 'approved' OR 
        user_id = auth.uid() OR 
        public.can_moderate_board_posts(board_id, auth.uid())
    ))
);

-- Add policy for moderators to update post approval status
CREATE POLICY "Board moderators can update post approval status"
ON public.board_posts
FOR UPDATE
USING (public.can_moderate_board_posts(board_id, auth.uid()));

-- Enable realtime for new tables
ALTER TABLE public.group_invites REPLICA IDENTITY FULL;
ALTER TABLE public.board_post_reactions REPLICA IDENTITY FULL;

-- Create trigger to auto-generate invite codes
CREATE OR REPLACE FUNCTION public.generate_emergency_contact_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.confirm_code := public.generate_confirmation_code();
  RETURN NEW;
END;
$$;