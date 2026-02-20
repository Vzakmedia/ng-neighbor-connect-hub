import { useEffect } from 'react';
import { App } from '@capacitor/app';

/**
 * useAppVersionCheck
 * 
 * Checks the current app version against the last installed version stored in localStorage.
 * If a new version is detected:
 * 1. Backs up critical auth tokens (Supabase)
 * 2. Clears localStorage (to remove stale caches)
 * 3. Restores auth tokens
 * 4. Updates the stored version
 * 5. Reloads the window to ensure fresh assets are loaded
 */
export const useAppVersionCheck = () => {
    useEffect(() => {
        const checkVersion = async () => {
            try {
                const info = await App.getInfo();
                const currentVersion = info.version; // e.g., "1.0.2"
                const lastVersion = localStorage.getItem('last_installed_version');

                console.log(`[AppVersion] Current: ${currentVersion}, Last: ${lastVersion}`);

                if (lastVersion && lastVersion !== currentVersion) {
                    console.log("[AppVersion] New version detected. Cleaning up...");

                    // 1. Backup Supabase session
                    // Supabase uses 'sb-<project-ref>-auth-token' usually. 
                    // We'll search for keys starting with 'sb-' and ending with '-auth-token' 
                    // or just backup everything that looks like a token if we can't be specific.
                    // For now, let's look for known Supabase keys.
                    const backup: Record<string, string> = {};

                    // Iterate keys to find auth tokens
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key === 'supabase.auth.token')) {
                            backup[key] = localStorage.getItem(key) || '';
                        }
                    }

                    // 2. Clear storage
                    localStorage.clear();

                    // 3. Restore session
                    Object.entries(backup).forEach(([key, value]) => {
                        if (value) localStorage.setItem(key, value);
                    });

                    // 4. Update version
                    localStorage.setItem('last_installed_version', currentVersion);

                    // 5. Reload to force fresh cache
                    window.location.reload();
                } else if (!lastVersion) {
                    // First run or fresh install
                    localStorage.setItem('last_installed_version', currentVersion);
                }
            } catch (error) {
                console.error('[AppVersion] Failed to check version:', error);
            }
        };

        checkVersion();
    }, []);
};
