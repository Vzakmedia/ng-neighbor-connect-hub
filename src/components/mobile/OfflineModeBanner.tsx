/**
 * Offline Mode Banner
 * Shows when the user is offline with pending sync information
 */

import React from 'react';
import { WifiOff, RefreshCw, CloudOff, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNativeNetwork } from '@/hooks/mobile/useNativeNetwork';
import { useOfflineActions } from '@/hooks/useOfflineActions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineModeBannerProps {
  className?: string;
  showWhenOnline?: boolean;
}

export const OfflineModeBanner: React.FC<OfflineModeBannerProps> = ({
  className,
  showWhenOnline = false,
}) => {
  const { isOnline, connectionType } = useNativeNetwork();
  const { 
    hasPendingActions, 
    pendingActions, 
    isSyncing, 
    triggerSync,
    isPaused,
  } = useOfflineActions();

  // Show banner when offline OR when online with pending actions (briefly)
  const [justCameOnline, setJustCameOnline] = React.useState(false);
  const [syncSuccess, setSyncSuccess] = React.useState(false);

  React.useEffect(() => {
    if (isOnline && hasPendingActions) {
      setJustCameOnline(true);
      // Auto-hide after sync completes or timeout
      const timeout = setTimeout(() => {
        setJustCameOnline(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, hasPendingActions]);

  React.useEffect(() => {
    if (isOnline && !hasPendingActions && justCameOnline) {
      setSyncSuccess(true);
      const timeout = setTimeout(() => {
        setSyncSuccess(false);
        setJustCameOnline(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, hasPendingActions, justCameOnline]);

  const showBanner = !isOnline || (showWhenOnline && (justCameOnline || syncSuccess));

  if (!showBanner) return null;

  const pendingCount = pendingActions.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 safe-top',
          className
        )}
      >
        <div
          className={cn(
            'px-4 py-3 flex items-center justify-between gap-3',
            !isOnline 
              ? 'bg-amber-500 dark:bg-amber-600' 
              : syncSuccess 
                ? 'bg-green-500 dark:bg-green-600'
                : 'bg-blue-500 dark:bg-blue-600'
          )}
        >
          <div className="flex items-center gap-3">
            {!isOnline ? (
              <WifiOff className="h-5 w-5 text-white shrink-0" />
            ) : syncSuccess ? (
              <Check className="h-5 w-5 text-white shrink-0" />
            ) : (
              <CloudOff className="h-5 w-5 text-white shrink-0" />
            )}
            
            <div className="text-white">
              <p className="font-medium text-sm">
                {!isOnline ? (
                  "You're offline"
                ) : syncSuccess ? (
                  "All changes synced!"
                ) : (
                  "Syncing your changes..."
                )}
              </p>
              {!isOnline && (
                <p className="text-xs text-white/80">
                  {pendingCount > 0 
                    ? `${pendingCount} pending ${pendingCount === 1 ? 'change' : 'changes'}`
                    : 'Viewing cached content'
                  }
                  {isPaused && ' • Sync paused (low battery)'}
                </p>
              )}
            </div>
          </div>

          {isOnline && hasPendingActions && !isSyncing && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 shrink-0"
              onClick={triggerSync}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Sync
            </Button>
          )}

          {isSyncing && (
            <RefreshCw className="h-5 w-5 text-white animate-spin shrink-0" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineModeBanner;
