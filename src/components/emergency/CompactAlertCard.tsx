import { ShareIcon, ExclamationTriangleIcon, ExclamationCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SafetyAlert } from '@/types/emergency';
import { formatDistance, formatTimeAgo, calculateDistance } from '@/utils/distanceCalculator';

interface CompactAlertCardProps {
  alert: SafetyAlert;
  userLocation?: { latitude: number; longitude: number };
  onClick: () => void;
}

const isRawCoordinates = (address: string) =>
  /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(address?.trim() ?? '');

const CompactAlertCard = ({ alert, userLocation, onClick }: CompactAlertCardProps) => {
  const distance = userLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        alert.latitude,
        alert.longitude
      )
    : null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  const getAlertTypeLabel = (type: string) =>
    type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: alert.title, text: alert.description, url: window.location.href });
    }
  };

  const locationDisplay = isRawCoordinates(alert.address) ? null : alert.address;

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${getSeverityColor(alert.severity)}`}>
          {alert.severity === 'critical' || alert.severity === 'high' ? (
            <ExclamationTriangleIcon className="h-5 w-5" />
          ) : (
            <ExclamationCircleIcon className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">
              {getAlertTypeLabel(alert.alert_type)}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={handleShare}
            >
              <ShareIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Reporter */}
          {alert.profiles?.full_name && (
            <div className="flex items-center gap-1.5 mb-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={alert.profiles.avatar_url} />
                <AvatarFallback className="text-xs">{alert.profiles.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">{alert.profiles.full_name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            {distance !== null && <span>{formatDistance(distance)}</span>}
            {distance !== null && <span>•</span>}
            <span>{formatTimeAgo(alert.created_at)}</span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {alert.description}
          </p>

          {locationDisplay && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPinIcon className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{locationDisplay}</span>
            </div>
          )}

          <p className="text-xs text-primary mt-2">Tap for full details & comments →</p>
        </div>
      </div>
    </Card>
  );
};

export default CompactAlertCard;
