import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ShieldCheckIcon, ExclamationTriangleIcon, MapPinIcon, ClockIcon, UserIcon, EyeIcon, BoltIcon, ChartBarIcon 
} from '@heroicons/react/24/outline';
import { SafetyAlert, SEVERITY_COLORS } from '@/types/emergency';

interface EmergencyAlertCardProps {
  alert: SafetyAlert;
  onClick: () => void;
  getTimeSince: (dateString: string) => string;
}

const alertTypeIcons = {
  break_in: ShieldCheckIcon,
  theft: ExclamationTriangleIcon,
  accident: BoltIcon,
  suspicious_activity: EyeIcon,
  harassment: UserIcon,
  fire: BoltIcon,
  flood: ChartBarIcon,
  power_outage: BoltIcon,
  road_closure: MapPinIcon,
  other: ExclamationTriangleIcon
};

const EmergencyAlertCard = ({ alert, onClick, getTimeSince }: EmergencyAlertCardProps) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <ShieldCheckIcon className="h-4 w-4 text-yellow-600" />;
      default:
        return <ShieldCheckIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const AlertIcon = alertTypeIcons[alert.alert_type as keyof typeof alertTypeIcons] || ExclamationTriangleIcon;

  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors touch-manipulation"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Alert Icon and Severity */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              {getSeverityIcon(alert.severity)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm md:text-base truncate">
                  {alert.title}
                </h3>
                <Badge className={`${SEVERITY_COLORS[alert.severity]} text-xs flex-shrink-0`}>
                  {alert.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  <AlertIcon className="h-3 w-3 mr-1" />
                  {alert.alert_type.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {alert.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate max-w-32 sm:max-w-48">
                    {alert.address}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3 flex-shrink-0" />
                  <span>{getTimeSince(alert.created_at)}</span>
                </div>
                {alert.profiles && (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={alert.profiles.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {alert.profiles.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-24">
                      {alert.profiles.full_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
            <Badge 
              variant={alert.status === 'active' ? 'destructive' : 
                      alert.status === 'resolved' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {alert.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyAlertCard;