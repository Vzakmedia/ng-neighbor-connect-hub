-- Fix foreign key relationship between safety_alerts and profiles
-- First, let's check if the foreign key exists and create it if needed

-- Add foreign key constraint between safety_alerts and auth.users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'safety_alerts_user_id_fkey' 
        AND table_name = 'safety_alerts'
    ) THEN
        ALTER TABLE public.safety_alerts 
        ADD CONSTRAINT safety_alerts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint between profiles and auth.users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable realtime for safety_alerts table
ALTER TABLE public.safety_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;

-- Enable realtime for alert_responses table  
ALTER TABLE public.alert_responses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_responses;

-- Create index for better performance on safety_alerts queries
CREATE INDEX IF NOT EXISTS idx_safety_alerts_user_id ON public.safety_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_status ON public.safety_alerts(status);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_created_at ON public.safety_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_severity ON public.safety_alerts(severity);

-- Create index for alert_responses
CREATE INDEX IF NOT EXISTS idx_alert_responses_alert_id ON public.alert_responses(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_responses_user_id ON public.alert_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_responses_created_at ON public.alert_responses(created_at DESC);