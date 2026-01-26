/**
 * Sync Status Indicator
 * Floating indicator showing pending sync items
 */

import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineActions } from '@/hooks/useOfflineActions';
import { useNativeNetwork } from '@/hooks/mobile/useNativeNetwork';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatusIndicatorProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className,
  position = 'bottom-right',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    hasPendingActions, 
    pendingActions, 
    isSyncing, 
    pendingCounts,
    triggerSync,
    isPaused,
  } = useOfflineActions();
  const { isOnline } = useNativeNetwork();

  // Don't show if no pending actions and online
  if (!hasPendingActions && isOnline) return null;

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="h-5 w-5 animate-spin" />;
    if (!isOnline) return <CloudOff className="h-5 w-5" />;
    if (hasPendingActions) return <Cloud className="h-5 w-5" />;
    return <Check className="h-5 w-5" />;
  };

  const getStatusColor = () => {
    if (isSyncing) return 'bg-blue-500 dark:bg-blue-600';
    if (!isOnline) return 'bg-amber-500 dark:bg-amber-600';
    if (hasPendingActions) return 'bg-orange-500 dark:bg-orange-600';
    return 'bg-green-500 dark:bg-green-600';
  };

  const failedActions = pendingActions.filter(a => a.retryCount > 0);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={cn(
        'fixed z-40',
        positionClasses[position],
        className
      )}
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 bg-background border border-border rounded-lg shadow-lg p-4 w-64"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Sync Status</h4>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Status summary */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Connection</span>
                <span className={isOnline ? 'text-green-600' : 'text-amber-600'}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span>{pendingActions.length} items</span>
              </div>

              {isPaused && (
                <div className="flex items-center gap-2 text-amber-600 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Sync paused (low battery)
                </div>
              )}
            </div>

            {/* Pending items breakdown */}
            {hasPendingActions && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Pending changes:</p>
                <div className="space-y-1">
                  {Object.entries(pendingCounts).map(([type, count]) => 
                    count > 0 && (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{type}s</span>
                        <span className="bg-muted px-2 py-0.5 rounded">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Failed items */}
            {failedActions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {failedActions.length} failed (will retry)
                </p>
              </div>
            )}

            {/* Recent pending items */}
            {pendingActions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border max-h-32 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2">Recent:</p>
                {pendingActions.slice(0, 3).map((action) => (
                  <div 
                    key={action.id} 
                    className="text-xs py-1 flex items-center justify-between"
                  >
                    <span className="capitalize truncate max-w-[120px]">
                      {action.type}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(action.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Sync button */}
            {isOnline && hasPendingActions && !isSyncing && (
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={triggerSync}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating indicator button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-white',
          getStatusColor()
        )}
      >
        {getStatusIcon()}
        
        {hasPendingActions && (
          <span className="text-sm font-medium">
            {pendingActions.length}
          </span>
        )}

        {!isExpanded && hasPendingActions && (
          <ChevronUp className="h-4 w-4" />
        )}
      </motion.button>
    </motion.div>
  );
};

export default SyncStatusIndicator;
