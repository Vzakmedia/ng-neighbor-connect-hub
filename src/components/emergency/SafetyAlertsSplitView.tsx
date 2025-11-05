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
    <div className="relative h-[calc(100vh-280px)] rounded-lg overflow-hidden">
      {/* Full Background Map */}
      <div className="absolute inset-0">
        <SafetyMap alerts={alerts} onAlertClick={onAlertClick} />
      </div>

      {/* Floating Alert List - Left Side */}
      <div className="absolute left-4 top-4 bottom-4 w-full max-w-md z-10">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-xl h-full">
          <ScrollArea className="h-full p-4">
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
      </div>
    </div>
  );
};

export default SafetyAlertsSplitView;
