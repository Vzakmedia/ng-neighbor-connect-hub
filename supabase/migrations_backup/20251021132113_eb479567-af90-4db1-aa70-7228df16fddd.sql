-- ====================================================================
-- PHASE 1: Drop Old Promotional System Tables and Functions
-- ====================================================================

-- Drop old RPC functions
DROP FUNCTION IF EXISTS public.get_active_promoted_content(character varying, integer);
DROP FUNCTION IF EXISTS public.log_promotion_impression(uuid, uuid);

-- Drop old tables (in correct order due to foreign key dependencies)
DROP TABLE IF EXISTS public.promotion_analytics CASCADE;
DROP TABLE IF EXISTS public.promoted_posts CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.promotion_campaigns CASCADE;