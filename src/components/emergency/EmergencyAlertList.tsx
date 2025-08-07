import { SafetyAlert } from '@/types/emergency';
import EmergencyAlertCard from './EmergencyAlertCard';

interface EmergencyAlertListProps {
  alerts: SafetyAlert[];
  loading: boolean;
  onAlertClick: (alert: SafetyAlert) => void;
  getTimeSince: (dateString: string) => string;
}

const EmergencyAlertList = ({ 
  alerts, 
  loading, 
  onAlertClick, 
  getTimeSince 
}: EmergencyAlertListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛡️</div>
        <h3 className="text-lg font-semibold mb-2">No Safety Alerts</h3>
        <p className="text-muted-foreground">
          No safety alerts match your current filters. Your community is safe!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {alerts.map((alert) => (
        <EmergencyAlertCard
          key={alert.id}
          alert={alert}
          onClick={() => onAlertClick(alert)}
          getTimeSince={getTimeSince}
        />
      ))}
    </div>
  );
};

export default EmergencyAlertList;