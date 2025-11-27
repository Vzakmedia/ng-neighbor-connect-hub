import { Wifi, VolumeX as WifiOff, Signal } from '@/lib/icons';
import { useConnectionManager } from '@/hooks/useConnectionManager';
import { cn } from '@/lib/utils';

export const NetworkQualityIndicator = () => {
  const { state, networkQuality } = useConnectionManager();

  const getQualityIcon = () => {
    if (!state.isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    return <Signal className="h-4 w-4" />;
  };

  const getQualityColor = () => {
    if (!state.isOnline) return 'text-destructive';
    
    const quality = state.networkQuality;
    if (quality > 70) return 'text-green-500';
    if (quality > 50) return 'text-yellow-500';
    if (quality > 30) return 'text-orange-500';
    return 'text-destructive';
  };

  const getConnectionTypeIcon = () => {
    if (state.connectionType === 'wifi') {
      return <Wifi className="h-3 w-3" />;
    }
    return null;
  };

  const getStatusText = () => {
    if (!state.isOnline) return 'Offline';
    if (state.connectionState === 'reconnecting') return 'Reconnecting...';
    if (state.connectionState === 'connecting') return 'Connecting...';
    if (state.congestionLevel === 'high') return 'Slow connection';
    if (state.congestionLevel === 'medium') return 'Limited connection';
    return '';
  };

  const statusText = getStatusText();

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={cn('flex items-center gap-1', getQualityColor())}>
        {getQualityIcon()}
        {getConnectionTypeIcon()}
      </div>
      
      {statusText && (
        <span className="text-muted-foreground">{statusText}</span>
      )}
      
      {state.connectionState === 'connected' && state.currentRtt > 0 && (
        <span className="text-muted-foreground">
          {Math.round(state.currentRtt)}ms
        </span>
      )}
    </div>
  );
};
