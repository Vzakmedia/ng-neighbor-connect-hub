import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Cached 2FA status for the current user.
 * staleTime = 5 min so navigating between routes doesn't re-query on every render.
 * Results are shared across all consumers via the React Query cache.
 */
export function use2FAStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ['2fa-status', userId],
    queryFn: async () => {
      if (!userId) return { enabled: false, verified: false };

      const [{ data: twoFARow }, { data: sessionRow }] = await Promise.all([
        supabase
          .from('user_2fa')
          .select('is_enabled')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_2fa_sessions')
          .select('expires_at')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const enabled = twoFARow?.is_enabled ?? false;
      const verified =
        enabled &&
        !!sessionRow &&
        new Date(sessionRow.expires_at) > new Date();

      return { enabled, verified };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}
