import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useRoutePersistence } from '@/hooks/mobile/useRoutePersistence';
import { setAppActive } from '@/utils/appState';
import { pauseAllSubscriptions, resumeAllSubscriptions } from '@/utils/realtimeUtils';

const STALE_THRESHOLD_MS = 30_000; // Invalidate feed/notifications if backgrounded >30s

/**
 * AppLifecycleManager
 *
 * Single owner of the Capacitor appStateChange listener. Sets the shared
 * appState flag, pauses/resumes all Supabase Realtime channels, and
 * performs selective query invalidation on foreground after a long background.
 */
export const AppLifecycleManager = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useScrollRestoration();
  useRoutePersistence();

  // Route to the right screen when user taps a push notification while app is closed
  useEffect(() => {
    const handler = (e: Event) => {
      const { route } = (e as CustomEvent<{ route: string }>).detail;
      if (route) navigate(route);
    };
    window.addEventListener('push-notification-tap', handler);
    return () => window.removeEventListener('push-notification-tap', handler);
  }, [navigate]);

  useEffect(() => {
    const listenerPromise = App.addListener('appStateChange', async ({ isActive }) => {
      setAppActive(isActive);

      if (!isActive) {
        // ── BACKGROUND ──────────────────────────────────────────────────
        pauseAllSubscriptions();

        try {
          sessionStorage.setItem(
            `scroll_${window.location.pathname}`,
            window.scrollY.toString(),
          );
          sessionStorage.setItem('app_background_at', Date.now().toString());
        } catch (_) { /* sessionStorage unavailable */ }

      } else {
        // ── FOREGROUND ───────────────────────────────────────────────────
        resumeAllSubscriptions();

        // Selective invalidation: only invalidate if we were backgrounded long enough
        // for data to go stale. Avoids aggressive double-fetching on quick switches.
        try {
          const backgroundedAt = Number(sessionStorage.getItem('app_background_at') || '0');
          const staleSince = backgroundedAt ? Date.now() - backgroundedAt : 0;

          if (staleSince > STALE_THRESHOLD_MS) {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
          sessionStorage.removeItem('app_background_at');
        } catch (_) { /* sessionStorage unavailable */ }
      }
    });

    return () => {
      listenerPromise.then(handle => handle.remove());
    };
  }, [queryClient]);

  return null;
};
