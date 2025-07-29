-- Add remaining RLS policies for super_admin access (avoiding duplicates)

-- Allow super_admin to view all profiles (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Super admins can view all profiles') THEN
        CREATE POLICY "Super admins can view all profiles" 
        ON public.profiles 
        FOR SELECT 
        USING (has_role(auth.uid(), 'super_admin'));
    END IF;
END $$;

-- Allow super_admin to view all user_roles (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Super admins can view all user roles') THEN
        CREATE POLICY "Super admins can view all user roles" 
        ON public.user_roles 
        FOR SELECT 
        USING (has_role(auth.uid(), 'super_admin'));
    END IF;
END $$;

-- Allow super_admin to view all safety_alerts (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'safety_alerts' AND policyname = 'Super admins can view all safety alerts') THEN
        CREATE POLICY "Super admins can view all safety alerts" 
        ON public.safety_alerts 
        FOR SELECT 
        USING (has_role(auth.uid(), 'super_admin'));
    END IF;
END $$;

-- Allow super_admin to view all marketplace_items (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_items' AND policyname = 'Super admins can view all marketplace items') THEN
        CREATE POLICY "Super admins can view all marketplace items" 
        ON public.marketplace_items 
        FOR SELECT 
        USING (has_role(auth.uid(), 'super_admin'));
    END IF;
END $$;

-- Allow super_admin to view all promotions (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'Super admins can view all promotions') THEN
        CREATE POLICY "Super admins can view all promotions" 
        ON public.promotions 
        FOR SELECT 
        USING (has_role(auth.uid(), 'super_admin'));
    END IF;
END $$;

-- Allow super_admin to view all content_reports (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_reports' AND policyname = 'Super admins can view all content reports') THEN
        CREATE POLICY "Super admins can view all content reports" 
        ON public.content_reports 
        FOR ALL 
        USING (has_role(auth.uid(), 'super_admin'))
        WITH CHECK (has_role(auth.uid(), 'super_admin'));
    END IF;
END $$;

-- Allow super_admin to view all businesses (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'businesses' AND policyname = 'Super admins can view all businesses') THEN
        CREATE POLICY "Super admins can view all businesses" 
        ON public.businesses 
        FOR SELECT 
        USING (has_role(auth.uid(), 'super_admin'));
    END IF;
END $$;