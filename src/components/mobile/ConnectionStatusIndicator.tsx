import { useEffect, useState } from 'react';
import { Wifi, AlertCircle } from '@/lib/icons';
import { getConnectionDiagnostics } from '@/utils/realtimeUtils';
import { Badge } from '@/components/ui/badge';
const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

/**
 * Connection Status Indicator for iOS
 * Shows real-time connection status and falls back to polling when needed
 */
export const ConnectionStatusIndicator = () => {
  const [status, setStatus] = useState<'connected' | 'polling' | 'disconnected' | 'connecting'>('connecting');
  const [showIndicator, setShowIndicator] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Startup grace period - wait for connections to establish
  useEffect(() => {
    const startupDelay = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 5000);

    return () => clearTimeout(startupDelay);
  }, []);

  useEffect(() => {
    // Only show on iOS or when there are connection issues
    if (!isIOS && !isNativePlatform()) return;

    const checkStatus = () => {
      const diagnostics = getConnectionDiagnostics();
      const recentDiags = diagnostics.slice(-10);

      // If no diagnostics yet, we're still connecting - don't show warning
      if (recentDiags.length === 0) {
        setStatus('connecting');
        setShowIndicator(false);
        return;
      }

      const hasErrors = recentDiags.some(
        d => d.status === 'WEBSOCKET_ERROR' || d.status === 'CHANNEL_ERROR'
      );
      const hasSubscribed = recentDiags.some(d => d.status === 'SUBSCRIBED');

      if (hasSubscribed && !hasErrors) {
        setStatus('connected');
        setShowIndicator(false);
      } else if (hasErrors) {
        setStatus('polling');
        // Only show if initial load is complete
        setShowIndicator(initialLoadComplete);
      } else {
        setStatus('disconnected');
        // Only show if initial load is complete AND we have diagnostics
        setShowIndicator(initialLoadComplete && recentDiags.length > 0);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [isIOS, initialLoadComplete]);

  if (isNativePlatform()) return null;

  if (!showIndicator) return null;

  return (
    <div className="fixed top-16 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <Badge
        variant={status === 'polling' ? 'secondary' : 'destructive'}
        className="flex items-center gap-2 px-3 py-2 shadow-lg"
      >
        {status === 'polling' ? (
          <>
            <Wifi className="h-3 w-3" />
            <span className="text-xs">Using polling mode</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">Connection limited</span>
          </>
        )}
      </Badge>
    </div>
  );
};
