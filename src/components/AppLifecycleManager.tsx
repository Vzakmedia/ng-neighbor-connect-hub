import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useQueryClient } from '@tanstack/react-query';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

/**
 * AppLifecycleManager
 * 
 * Handles:
 * 1. App backgrounding/foregrounding (Pause/Resume)
 * 2. Scroll restoration logic
 * 3. Persisting state on background
 */
export const AppLifecycleManager = () => {
    const queryClient = useQueryClient();

    // Enable scroll restoration
    useScrollRestoration();

    useEffect(() => {
        // Handle App State Changes (Capacitor)
        const listener = App.addListener('appStateChange', async ({ isActive }) => {
            const timestamp = new Date().toISOString();
            const state = isActive ? 'RESUMED' : 'PAUSED';

            console.log(`[AppLifecycle ${timestamp}] App state changed: ${state}`);

            if (!isActive) {
                // App going to background (PAUSED)
                // 1. Force persist react-query cache immediately if possible?
                // (The persister is already configured to throttle, but we rely on its internal logic)

                // 2. Save current scroll position explicitly
                try {
                    sessionStorage.setItem(`scroll_${window.location.pathname}`, window.scrollY.toString());
                } catch (e) { console.error('Failed to save scroll on pause', e); }

            } else {
                // App coming to foreground (RESUMED)
                // 1. Refetch active queries to ensure freshness
                // queryClient.invalidateQueries({ type: 'active' }); // Optional: might be too aggressive

                // 2. Resume specific services if needed (e.g. location, polling)
            }
        });

        return () => {
            listener.then(handle => handle.remove());
        };
    }, [queryClient]);

    return null;
};
