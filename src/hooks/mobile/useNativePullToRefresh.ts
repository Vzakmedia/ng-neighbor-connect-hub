import { useRef, useState, useCallback } from 'react';
import { useNativeHaptics } from './useNativeHaptics';

const THRESHOLD = 72;    // px — pull distance that triggers a refresh
const MAX_TRAVEL = 80;   // px — maximum visual pull distance (capped)
const RESISTANCE = 0.45; // Rubber-band damping factor

const isNativePlatform = (): boolean =>
  (window as any).Capacitor?.isNativePlatform?.() === true;

interface NativePullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

interface NativePullToRefreshResult extends NativePullToRefreshState {
  containerRef: React.RefObject<HTMLDivElement>;
  /** Bind these to the scrollable container element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export const useNativePullToRefresh = (
  onRefresh: () => Promise<void>,
): NativePullToRefreshResult => {
  const { impact, notification } = useNativeHaptics();
  const isNative = isNativePlatform();

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const hapticFiredRef = useRef(false);

  const [state, setState] = useState<NativePullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start tracking when the container is scrolled to the top
    const el = containerRef.current;
    const scrollTop = el ? el.scrollTop : window.scrollY;
    if (scrollTop > 0) return;

    startYRef.current = e.touches[0].clientY;
    hapticFiredRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (state.isRefreshing) return;

    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) return;

    // Rubber-band: travel slows as distance increases
    const capped = Math.min(delta * RESISTANCE, MAX_TRAVEL);

    // Fire haptic once when threshold is crossed
    if (capped >= THRESHOLD * RESISTANCE && !hapticFiredRef.current) {
      hapticFiredRef.current = true;
      if (isNative) impact('medium');
    }

    setState(prev => ({ ...prev, isPulling: true, pullDistance: capped }));
  }, [state.isRefreshing, isNative, impact]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling) return;

    const triggered = state.pullDistance >= THRESHOLD * RESISTANCE;

    if (!triggered) {
      setState({ isPulling: false, pullDistance: 0, isRefreshing: false });
      return;
    }

    setState({ isPulling: false, pullDistance: 0, isRefreshing: true });

    try {
      await onRefresh();
      if (isNative) notification('success');
    } finally {
      setState({ isPulling: false, pullDistance: 0, isRefreshing: false });
    }
  }, [state.isPulling, state.pullDistance, isNative, notification, onRefresh]);

  return {
    ...state,
    containerRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
