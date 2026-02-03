-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  last_response_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  tags TEXT[]
);

-- Create support ticket responses table
CREATE TABLE IF NOT EXISTS public.support_ticket_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  is_staff_response BOOLEAN DEFAULT false,
  is_internal_note BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attachments JSONB DEFAULT '[]',
  email_message_id TEXT,
  response_type TEXT DEFAULT 'text' CHECK (response_type IN ('text', 'email', 'internal'))
);

-- Create email inbox table for support
CREATE TABLE IF NOT EXISTS public.support_email_inbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  message_id TEXT UNIQUE,
  thread_id TEXT,
  labels TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_replied BOOLEAN DEFAULT false,
  ticket_id UUID REFERENCES public.support_tickets(id),
  assigned_to UUID REFERENCES auth.users(id),
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]'
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_email_inbox ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Support staff can view all tickets" ON public.support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('support', 'super_admin', 'manager')
    )
  );

CREATE POLICY "Support staff can update tickets" ON public.support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('support', 'super_admin', 'manager')
    )
  );

-- RLS Policies for ticket responses
CREATE POLICY "Users can view responses to their tickets" ON public.support_ticket_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can respond to their tickets" ON public.support_ticket_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

CREATE POLICY "Support staff can view all responses" ON public.support_ticket_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('support', 'super_admin', 'manager')
    )
  );

CREATE POLICY "Support staff can create responses" ON public.support_ticket_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('support', 'super_admin', 'manager')
    )
  );

-- RLS Policies for email inbox
CREATE POLICY "Support staff can view all emails" ON public.support_email_inbox
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('support', 'super_admin', 'manager')
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_ticket_responses_ticket_id ON public.support_ticket_responses(ticket_id);
CREATE INDEX idx_support_email_inbox_message_id ON public.support_email_inbox(message_id);
CREATE INDEX idx_support_email_inbox_thread_id ON public.support_email_inbox(thread_id);
CREATE INDEX idx_support_email_inbox_is_read ON public.support_email_inbox(is_read);
CREATE INDEX idx_support_email_inbox_ticket_id ON public.support_email_inbox(ticket_id);