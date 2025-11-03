import { useEffect, useRef } from 'react';

/**
 * Hook for tracking post visibility using Intersection Observer
 * Only marks posts as read after they've been visible for 2+ seconds
 */
export function usePostVisibility(onVisible: (postId: string) => void) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibilityTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute('data-post-id');
          if (!postId) return;

          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Start 2-second timer only if >50% visible and no existing timer
            if (!visibilityTimersRef.current.has(postId)) {
              const timer = setTimeout(() => {
                onVisible(postId);
                visibilityTimersRef.current.delete(postId);
              }, 2000); // 2 second delay before marking as read
              visibilityTimersRef.current.set(postId, timer);
            }
          } else {
            // Clear timer if post scrolls out of view
            const timer = visibilityTimersRef.current.get(postId);
            if (timer) {
              clearTimeout(timer);
              visibilityTimersRef.current.delete(postId);
            }
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% is shown
    );

    return () => {
      // Clean up all timers
      visibilityTimersRef.current.forEach(timer => clearTimeout(timer));
      visibilityTimersRef.current.clear();
      observerRef.current?.disconnect();
    };
  }, [onVisible]);

  const observePost = (element: HTMLDivElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  };

  return { observePost };
}
