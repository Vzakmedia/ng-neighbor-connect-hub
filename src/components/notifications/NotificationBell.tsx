import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export const NotificationBell = ({ onClick, className }: NotificationBellProps) => {
  const unreadCount = useNotificationStore(state => state.unreadCount);

  const handleClick = async () => {
    if (isNativePlatform()) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.error('Haptics error:', error);
      }
    }
    onClick();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={handleClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <BellIcon className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};
