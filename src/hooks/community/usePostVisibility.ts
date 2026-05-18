import { useEffect, useRef } from 'react';

/**
 * Hook for tracking post visibility using Intersection Observer
 * Only marks posts as read after they've been visible for 2+ seconds
 */
export function usePostVisibility(onVisible: (postId: string) => void) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibilityTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const onVisibleRef = useRef(onVisible);

  useEffect(() => {
    onVisibleRef.current = onVisible;
  });

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute('data-post-id');
          if (!postId) return;

          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            if (!visibilityTimersRef.current.has(postId)) {
              const timer = setTimeout(() => {
                onVisibleRef.current(postId);
                visibilityTimersRef.current.delete(postId);
              }, 2000);
              visibilityTimersRef.current.set(postId, timer);
            }
          } else {
            const timer = visibilityTimersRef.current.get(postId);
            if (timer) {
              clearTimeout(timer);
              visibilityTimersRef.current.delete(postId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    return () => {
      visibilityTimersRef.current.forEach(timer => clearTimeout(timer));
      visibilityTimersRef.current.clear();
      observerRef.current?.disconnect();
    };
  }, []);

  const observePost = (element: HTMLDivElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  };

  return { observePost };
}
