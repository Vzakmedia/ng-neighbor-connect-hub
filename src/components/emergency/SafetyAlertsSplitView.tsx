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
    <div className="relative h-[calc(100vh-140px)] md:rounded-lg overflow-hidden">
      {/* Full Background Map */}
      <div className="absolute inset-0">
        <SafetyMap alerts={alerts} onAlertClick={onAlertClick} />
      </div>

      {/* Alert List - Bottom drawer on mobile, left floating card on desktop */}
      {alerts.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 lg:left-4 lg:top-4 lg:bottom-4 lg:right-auto lg:w-full lg:max-w-md z-10">
          <div className="bg-background/95 backdrop-blur-sm rounded-t-2xl lg:rounded-lg shadow-xl h-[40vh] lg:h-full">
            <ScrollArea className="h-full p-4">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <CompactAlertCard
                    key={alert.id}
                    alert={alert}
                    userLocation={userLocation}
                    onClick={() => onAlertClick(alert)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Small badge when no alerts */}
      {alerts.length === 0 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border">
            <p className="text-sm text-muted-foreground">No alerts in your area</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyAlertsSplitView;
