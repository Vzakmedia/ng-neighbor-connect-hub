-- Fix remaining function search path security warnings
ALTER FUNCTION public.generate_board_invite_code() SET search_path TO 'public';
ALTER FUNCTION public.generate_confirmation_code() SET search_path TO 'public';