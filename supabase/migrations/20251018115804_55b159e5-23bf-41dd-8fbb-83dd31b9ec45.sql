-- Migration: Add missing foreign key constraints
-- Skip tables that already have the constraint

-- Clean orphaned records first
DELETE FROM public.events WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.post_likes WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.post_comments WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.saved_posts WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.services WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.marketplace_items WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.safety_alerts WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
DELETE FROM public.panic_alerts WHERE user_id NOT IN (SELECT user_id FROM public.profiles);

-- Add foreign keys only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_user_id_fkey') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_user_id_fkey') THEN
    ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_comments_user_id_fkey') THEN
    ALTER TABLE public.post_comments ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_posts_user_id_fkey') THEN
    ALTER TABLE public.saved_posts ADD CONSTRAINT saved_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_user_id_fkey') THEN
    ALTER TABLE public.services ADD CONSTRAINT services_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_items_user_id_fkey') THEN
    ALTER TABLE public.marketplace_items ADD CONSTRAINT marketplace_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'safety_alerts_user_id_fkey') THEN
    ALTER TABLE public.safety_alerts ADD CONSTRAINT safety_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'panic_alerts_user_id_fkey') THEN
    ALTER TABLE public.panic_alerts ADD CONSTRAINT panic_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON public.services(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_user_id ON public.marketplace_items(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_user_id ON public.safety_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_panic_alerts_user_id ON public.panic_alerts(user_id);