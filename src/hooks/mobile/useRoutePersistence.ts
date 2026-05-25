import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PREF_KEY = 'app_last_route';

// These routes must never be restored — they require a fresh auth flow
const SKIP_ROUTES = new Set(['/auth', '/complete-profile', '/verify-email', '/']);

const isNative = () => window.Capacitor?.isNativePlatform?.() === true;

async function saveRoute(path: string): Promise<void> {
  const { Preferences } = await import('@capacitor/preferences');
  await Preferences.set({ key: PREF_KEY, value: path });
}

async function loadRoute(): Promise<string | null> {
  const { Preferences } = await import('@capacitor/preferences');
  const { value } = await Preferences.get({ key: PREF_KEY });
  return value;
}

/**
 * On native cold-start: navigates directly to the user's last location so the
 * app resumes where they left off instead of always landing on the default route.
 * On every navigation: saves the current path so the next cold-start can restore it.
 */
export const useRoutePersistence = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Restore on first mount (cold start)
  useEffect(() => {
    if (!isNative()) return;

    loadRoute()
      .then((saved) => {
        if (saved && saved !== location.pathname && !SKIP_ROUTES.has(saved)) {
          navigate(saved, { replace: true });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once

  // Persist on every navigation change
  useEffect(() => {
    if (!isNative()) return;
    if (SKIP_ROUTES.has(location.pathname)) return;
    saveRoute(location.pathname).catch(() => {});
  }, [location.pathname]);
};
