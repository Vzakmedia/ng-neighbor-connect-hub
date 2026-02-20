import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * useScrollRestoration - Smart scroll management
 * 
 * - Saves scroll position on navigation (PUSH)
 * - Restores scroll position on back (POP)
 * - Scrolls to top on new navigation (PUSH) unless preserved
 */
export const useScrollRestoration = () => {
    const location = useLocation();
    const navType = useNavigationType();
    const scrollPositions = useRef<Record<string, number>>({});

    useEffect(() => {
        // Save scroll position for the current path before the effect cleanups or re-runs
        const handleScroll = () => {
            scrollPositions.current[location.pathname] = window.scrollY;

            // Persist to sessionStorage for page reloads
            try {
                sessionStorage.setItem(`scroll_${location.pathname}`, window.scrollY.toString());
            } catch (e) {
                // Ignore storage errors
            }
        };

        // Throttled scroll listener
        let timeoutId: NodeJS.Timeout;
        const throttledScroll = () => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                handleScroll();
                timeoutId = undefined as any;
            }, 100);
        };

        window.addEventListener('scroll', throttledScroll);
        return () => {
            window.removeEventListener('scroll', throttledScroll);
            clearTimeout(timeoutId);
        };
    }, [location.pathname]);

    useEffect(() => {
        // Handle restoration or reset on route change

        // Restore from session storage if available (for reloads)
        const savedPos = sessionStorage.getItem(`scroll_${location.pathname}`);
        const memoryPos = scrollPositions.current[location.pathname];

        const targetPos = memoryPos ?? (savedPos ? parseInt(savedPos) : 0);

        if (navType === 'POP') {
            // Back button pressed - restore position
            // Small timeout to allow content to render
            setTimeout(() => {
                window.scrollTo({
                    top: targetPos,
                    behavior: 'auto' // Instant jump for restoration
                });
            }, 0);
        } else {
            // New navigation (PUSH/REPLACE) - scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'auto'
            });
        }
    }, [location.pathname, navType]);
};
