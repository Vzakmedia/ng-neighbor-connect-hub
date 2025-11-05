import { SafetyAlert } from '@/types/emergency';
import CompactAlertCard from './CompactAlertCard';
import SafetyMap from '../SafetyMap';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SafetyAlertsSplitViewProps {
  alerts: SafetyAlert[];
  userLocation?: { latitude: number; longitude: number };
  onAlertClick: (alert: SafetyAlert) => void;
}

const SafetyAlertsSplitView = ({
  alerts,
  userLocation,
  onAlertClick,
}: SafetyAlertsSplitViewProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-4 h-[calc(100vh-280px)]">
      {/* Left: Alert List */}
      <div className="order-2 lg:order-1">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No alerts in your area</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <CompactAlertCard
                  key={alert.id}
                  alert={alert}
                  userLocation={userLocation}
                  onClick={() => onAlertClick(alert)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Map View */}
      <div className="order-1 lg:order-2 h-[300px] lg:h-full rounded-lg overflow-hidden sticky top-4">
        <SafetyMap alerts={alerts} onAlertClick={onAlertClick} />
      </div>
    </div>
  );
};

export default SafetyAlertsSplitView;
