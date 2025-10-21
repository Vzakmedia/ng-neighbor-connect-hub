import { useEffect, useRef } from 'react';

/**
 * Hook for tracking post visibility using Intersection Observer
 */
export function usePostVisibility(onVisible: (postId: string) => void) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId) {
              onVisible(postId);
            }
          }
        });
      },
      { threshold: 0.5 } // Mark as visible when 50% is shown
    );

    return () => {
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
