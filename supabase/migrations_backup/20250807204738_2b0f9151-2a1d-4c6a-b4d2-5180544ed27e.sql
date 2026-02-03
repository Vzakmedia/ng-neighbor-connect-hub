-- Fix function search path security warnings for all functions
ALTER FUNCTION public.update_service_rating() SET search_path TO 'public';
ALTER FUNCTION public.update_marketplace_rating() SET search_path TO 'public';
ALTER FUNCTION public.update_direct_conversation_on_message() SET search_path TO 'public';
ALTER FUNCTION public.update_message_delivery_status() SET search_path TO 'public';
ALTER FUNCTION public.update_promotion_analytics() SET search_path TO 'public';