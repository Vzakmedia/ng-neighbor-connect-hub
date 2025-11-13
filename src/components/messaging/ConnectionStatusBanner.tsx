import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, VolumeX as WifiOff, Loader2 } from '@/lib/icons';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useEffect, useState } from 'react';

export const ConnectionStatusBanner = () => {
  const { status } = useConnectionStatus();
  const [showConnected, setShowConnected] = useState(false);

  useEffect(() => {
    if (status === 'connected') {
      setShowConnected(true);
      const timer = setTimeout(() => setShowConnected(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status === 'connected' && !showConnected) {
    return null;
  }

  const statusConfig = {
    connecting: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: 'Connecting...',
      variant: 'default' as const,
    },
    connected: {
      icon: <Wifi className="h-4 w-4" />,
      text: 'Connected',
      variant: 'default' as const,
    },
    disconnected: {
      icon: <WifiOff className="h-4 w-4" />,
      text: 'Reconnecting...',
      variant: 'destructive' as const,
    },
    offline: {
      icon: <WifiOff className="h-4 w-4" />,
      text: 'No internet connection',
      variant: 'destructive' as const,
    },
  };

  const config = statusConfig[status];

  return (
    <Alert variant={config.variant} className="mb-4">
      <div className="flex items-center gap-2">
        {config.icon}
        <AlertDescription>{config.text}</AlertDescription>
      </div>
    </Alert>
  );
};
