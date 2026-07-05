import { supabase } from '@/integrations/supabase/client';

/**
 * Single source of truth for who may see a safety alert and for how long.
 *
 * Rules (applied by the banner, the notification bell, and realtime handlers):
 *  1. Alerts are only visible to users in the SAME neighborhood as the author.
 *  2. Alerts expire from every surface after 24 hours.
 *  3. Users never see alerts created before they signed up (clean slate).
 *  4. Users never see their own alerts as incoming notifications.
 */

export const SAFETY_ALERT_WINDOW_HOURS = 24;
export const SAFETY_ALERT_WINDOW_MS = SAFETY_ALERT_WINDOW_HOURS * 60 * 60 * 1000;

/**
 * Earliest `created_at` a safety alert may have and still be shown to this
 * user: never older than the 24h window, never before the user's signup.
 */
export const getSafetyAlertWindowStart = (userCreatedAt?: string | null): string => {
  const windowStart = Date.now() - SAFETY_ALERT_WINDOW_MS;
  const signupTime = userCreatedAt ? new Date(userCreatedAt).getTime() : 0;
  const effectiveStart = Number.isNaN(signupTime)
    ? windowStart
    : Math.max(windowStart, signupTime);
  return new Date(effectiveStart).toISOString();
};

export const isWithinSafetyAlertWindow = (
  createdAt: string,
  userCreatedAt?: string | null,
): boolean => {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return created >= new Date(getSafetyAlertWindowStart(userCreatedAt)).getTime();
};

// Session-scoped cache: profile neighborhoods change rarely, and realtime
// handlers must not issue a profile query per event.
const neighborhoodCache = new Map<string, string | null>();

export const getUserNeighborhood = async (userId: string): Promise<string | null> => {
  if (neighborhoodCache.has(userId)) {
    return neighborhoodCache.get(userId) ?? null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('neighborhood')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[alertVisibility] Failed to load neighborhood for', userId, error);
    return null; // don't cache failures — allow retry on the next event
  }

  const neighborhood = data?.neighborhood ?? null;
  neighborhoodCache.set(userId, neighborhood);
  return neighborhood;
};

export const clearNeighborhoodCache = (): void => {
  neighborhoodCache.clear();
};

interface SafetyAlertVisibilityOptions {
  alertUserId: string;
  alertCreatedAt: string;
  alertNeighborhood: string | null | undefined;
  viewerId: string;
  viewerCreatedAt?: string | null;
  viewerNeighborhood: string | null | undefined;
}

/**
 * Strict visibility predicate. When either party has no neighborhood set the
 * alert is NOT shown — matching the existing Safety-page behavior
 * ("no neighborhood = no alerts") rather than leaking alerts nationwide.
 */
export const isSafetyAlertVisible = ({
  alertUserId,
  alertCreatedAt,
  alertNeighborhood,
  viewerId,
  viewerCreatedAt,
  viewerNeighborhood,
}: SafetyAlertVisibilityOptions): boolean => {
  if (alertUserId === viewerId) return false;
  if (!isWithinSafetyAlertWindow(alertCreatedAt, viewerCreatedAt)) return false;
  if (!viewerNeighborhood || !alertNeighborhood) return false;
  return alertNeighborhood === viewerNeighborhood;
};
