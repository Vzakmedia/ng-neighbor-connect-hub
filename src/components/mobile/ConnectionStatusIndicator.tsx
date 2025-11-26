import { useEffect, useState } from 'react';
import { Wifi, AlertCircle } from '@/lib/icons';
import { getConnectionDiagnostics } from '@/utils/realtimeUtils';
import { Badge } from '@/components/ui/badge';
import { Capacitor } from '@capacitor/core';

/**
 * Connection Status Indicator for iOS
 * Shows real-time connection status and falls back to polling when needed
 */
export const ConnectionStatusIndicator = () => {
  const [status, setStatus] = useState<'connected' | 'polling' | 'disconnected'>('connected');
  const [showIndicator, setShowIndicator] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    // Only show on iOS or when there are connection issues
    if (!isIOS && !Capacitor.isNativePlatform()) return;

    const checkStatus = () => {
      const diagnostics = getConnectionDiagnostics();
      const recentDiags = diagnostics.slice(-10); // Last 10 events

      const hasErrors = recentDiags.some(
        d => d.status === 'WEBSOCKET_ERROR' || d.status === 'CHANNEL_ERROR'
      );
      const hasSubscribed = recentDiags.some(d => d.status === 'SUBSCRIBED');

      if (hasSubscribed && !hasErrors) {
        setStatus('connected');
        setShowIndicator(false);
      } else if (hasErrors) {
        setStatus('polling');
        setShowIndicator(true);
      } else {
        setStatus('disconnected');
        setShowIndicator(true);
      }
    };

    // Check immediately
    checkStatus();

    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [isIOS]);

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
