import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export const NotificationBell = ({ onClick, className }: NotificationBellProps) => {
  const unreadCount = useNotificationStore(state => state.unreadCount);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={onClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
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
