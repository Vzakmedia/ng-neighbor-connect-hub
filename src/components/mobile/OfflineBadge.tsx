/**
 * Offline Badge
 * Shows availability status for cached content
 */

import React from 'react';
import { WifiOff, Clock, CloudOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNativeNetwork } from '@/hooks/mobile/useNativeNetwork';

interface OfflineBadgeProps {
  /**
   * Whether this content is available offline
   */
  isAvailableOffline?: boolean;
  
  /**
   * When the content was cached
   */
  cachedAt?: Date | string | number;
  
  /**
   * Whether to show the badge when online
   */
  showWhenOnline?: boolean;
  
  /**
   * Additional class names
   */
  className?: string;
  
  /**
   * Badge size
   */
  size?: 'sm' | 'md';
  
  /**
   * Variant style
   */
  variant?: 'badge' | 'pill' | 'icon-only';
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({
  isAvailableOffline = true,
  cachedAt,
  showWhenOnline = false,
  className,
  size = 'sm',
  variant = 'badge',
}) => {
  const { isOnline } = useNativeNetwork();

  // Don't show if online and not explicitly requested
  if (isOnline && !showWhenOnline) return null;

  const cacheAge = cachedAt 
    ? formatDistanceToNow(new Date(cachedAt), { addSuffix: true })
    : null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  if (variant === 'icon-only') {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          isAvailableOffline 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-muted-foreground',
          className
        )}
        title={isAvailableOffline ? 'Available offline' : 'Not cached'}
      >
        {isAvailableOffline ? (
          <WifiOff className={iconSize} />
        ) : (
          <CloudOff className={iconSize} />
        )}
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-full',
          sizeClasses[size],
          isAvailableOffline
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-muted text-muted-foreground',
          className
        )}
      >
        <WifiOff className={iconSize} />
        <span>{isAvailableOffline ? 'Offline' : 'Online only'}</span>
      </div>
    );
  }

  // Default badge variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border',
        sizeClasses[size],
        isAvailableOffline
          ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
          : 'bg-muted border-border text-muted-foreground',
        className
      )}
    >
      {isAvailableOffline ? (
        <>
          <WifiOff className={iconSize} />
          <span>Available offline</span>
          {cacheAge && (
            <span className="text-muted-foreground flex items-center gap-0.5">
              <Clock className={cn(iconSize, 'opacity-60')} />
              {cacheAge}
            </span>
          )}
        </>
      ) : (
        <>
          <CloudOff className={iconSize} />
          <span>Requires connection</span>
        </>
      )}
    </div>
  );
};

/**
 * Stale Content Indicator
 * Shows when viewing potentially outdated cached content
 */
export const StaleContentIndicator: React.FC<{
  cachedAt?: Date | string | number;
  className?: string;
}> = ({ cachedAt, className }) => {
  const { isOnline } = useNativeNetwork();

  // Only show when offline
  if (isOnline) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md',
        'bg-amber-50 border border-amber-200 text-amber-700',
        'dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
        className
      )}
    >
      <Clock className="h-4 w-4" />
      <span className="text-sm">
        Viewing cached content
        {cachedAt && ` from ${formatDistanceToNow(new Date(cachedAt), { addSuffix: true })}`}
      </span>
    </div>
  );
};

export default OfflineBadge;
