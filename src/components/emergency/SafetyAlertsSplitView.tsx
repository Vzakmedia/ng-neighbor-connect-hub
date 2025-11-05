import { SafetyAlert } from '@/types/emergency';
import CompactAlertCard from './CompactAlertCard';
import SafetyMap from '../SafetyMap';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import HorizontalFilters, { FilterCategory } from './HorizontalFilters';
import PanicButton from '../PanicButton';
import ReportIncidentDialog from '../ReportIncidentDialog';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SafetyAlertsSplitViewProps {
  alerts: SafetyAlert[];
  userLocation?: { latitude: number; longitude: number };
  onAlertClick: (alert: SafetyAlert) => void;
  locationText: string;
  selectedCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
}

const SafetyAlertsSplitView = ({
  alerts,
  userLocation,
  onAlertClick,
  locationText,
  selectedCategory,
  onCategoryChange,
}: SafetyAlertsSplitViewProps) => {
  return (
    <div className="relative h-[calc(100vh-140px)] md:rounded-lg overflow-hidden">
      {/* Full Background Map */}
      <div className="absolute inset-0">
        <SafetyMap alerts={alerts} onAlertClick={onAlertClick} />
      </div>

      {/* Floating Action Buttons - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <PanicButton />
        <ReportIncidentDialog
          trigger={
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white hover:bg-white/90 shadow-lg border-border h-10 px-4 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Report Incident</span>
            </Button>
          }
        />
      </div>

      {/* Left Sidebar Card - Bottom drawer on mobile, left floating card on desktop */}
      <div className="absolute bottom-0 left-0 right-0 lg:left-4 lg:top-4 lg:bottom-4 lg:right-auto lg:w-full lg:max-w-md z-10">
        <Card className="bg-white/95 dark:bg-background/95 backdrop-blur-sm rounded-t-2xl lg:rounded-lg shadow-xl h-[50vh] lg:h-full border-border">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{locationText}</h2>
            </div>

            {/* Filter Pills */}
            <div className="px-4 pt-3 pb-2 border-b border-border">
              <HorizontalFilters 
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
              />
            </div>

            {/* Alert List */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No alerts in your area</p>
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
        </Card>
      </div>
    </div>
  );
};

export default SafetyAlertsSplitView;
