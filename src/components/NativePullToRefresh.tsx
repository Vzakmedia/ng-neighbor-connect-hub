import React from 'react';
import { useNativePullToRefresh } from '@/hooks/mobile/useNativePullToRefresh';

const isNativePlatform = (): boolean =>
  (window as any).Capacitor?.isNativePlatform?.() === true;

interface NativePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

/**
 * Native-feeling pull-to-refresh wrapper.
 *
 * On native (iOS/Android): intercepts touch gestures, applies rubber-band
 * animation on the pull indicator, fires haptic at threshold, and calls
 * onRefresh on release.
 *
 * On web: renders children as-is with no wrapper overhead.
 */
export const NativePullToRefresh = ({
  onRefresh,
  children,
  className,
}: NativePullToRefreshProps) => {
  // On web, bypass entirely to avoid any touch interference
  if (!isNativePlatform()) {
    return <>{children}</>;
  }

  return <NativePullToRefreshInner onRefresh={onRefresh} className={className}>{children}</NativePullToRefreshInner>;
};

// Inner component only mounts on native (avoids hook call on web)
const NativePullToRefreshInner = ({
  onRefresh,
  children,
  className,
}: NativePullToRefreshProps) => {
  const { isPulling, pullDistance, isRefreshing, containerRef, handlers } =
    useNativePullToRefresh(onRefresh);

  const indicatorProgress = Math.min(pullDistance / 36, 1); // 0→1 over first 36px travel
  const indicatorVisible = isPulling || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overscrollBehaviorY: 'contain', position: 'relative' }}
      {...handlers}
    >
      {/* Pull indicator */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 48,
          transform: `translateY(${indicatorVisible ? pullDistance - 48 : -48}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--background, #fff)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${0.4 + indicatorProgress * 0.6})`,
            transition: isPulling ? 'none' : 'transform 0.2s ease',
          }}
        >
          {isRefreshing ? (
            <SpinnerIcon />
          ) : (
            <ArrowIcon rotation={indicatorProgress * 180} />
          )}
        </div>
      </div>

      {/* Content shifts down while pulling */}
      <div
        style={{
          transform: indicatorVisible ? `translateY(${pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
          willChange: indicatorVisible ? 'transform' : 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const SpinnerIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    style={{ animation: 'ptr-spin 0.7s linear infinite', color: 'var(--primary, #0b8d66)' }}
  >
    <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const ArrowIcon = ({ rotation }: { rotation: number }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: `rotate(${rotation}deg)`,
      color: 'var(--primary, #0b8d66)',
      transition: 'transform 0.1s linear',
    }}
  >
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

export default NativePullToRefresh;
