import { lazy, ComponentType } from 'react';

/**
 * A wrapper around React.lazy that attempts to retry the dynamic import
 * if it fails. This is especially useful for handling 'ChunkLoadError' or
 * 'Failed to fetch dynamically imported module' which often happen when
 * a new version of the app is deployed.
 */
export const lazyWithRetry = (componentImport: () => Promise<{ default: ComponentType<any> }>) =>
    lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );

        try {
            return await componentImport();
        } catch (error) {
            console.error('Dynamic import failed:', error);

            if (!pageHasAlreadyBeenForceRefreshed) {
                // A temporary solution to catch the error and force a refresh
                // This gives the browser a chance to fetch the latest manifest/chunks
                console.warn('Forcing page refresh to recover from dynamic import failure...');
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                window.location.reload();

                // Return a promise that never resolves to prevent further rendering 
                // while the page is reloading
                return new Promise(() => { });
            }

            // The error is still there after a refresh
            throw error;
        }
    });

// Clear the refresh flag when a component successfully mounts
// (Users can call this in a useEffect at the root of a lazy-loaded page)
export const clearRefreshFlag = () => {
    window.sessionStorage.removeItem('page-has-been-force-refreshed');
};
