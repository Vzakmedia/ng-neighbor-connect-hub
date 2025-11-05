import { useEffect } from 'react';

const scrollPositions = new Map<string, number>();

export function useScrollRestoration(
  scrollElement: HTMLElement | null,
  key: string
) {
  // Save scroll position before unmount
  useEffect(() => {
    return () => {
      if (scrollElement) {
        scrollPositions.set(key, scrollElement.scrollTop);
      }
    };
  }, [scrollElement, key]);

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollElement) {
      const savedPosition = scrollPositions.get(key);
      if (savedPosition !== undefined) {
        requestAnimationFrame(() => {
          scrollElement.scrollTop = savedPosition;
        });
      }
    }
  }, [scrollElement, key]);
}
