import { Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PanicButton from '../PanicButton';
import ReportIncidentDialog from '../ReportIncidentDialog';

const EmergencyHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
          <span className="truncate">Safety Center</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Community safety alerts and emergency reporting
        </p>
      </div>
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <PanicButton />
        <ReportIncidentDialog
          trigger={
            <Button className="hidden sm:flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              Report Incident
            </Button>
          }
        />
        <ReportIncidentDialog
          trigger={
            <Button className="sm:hidden h-9 w-9 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default EmergencyHeader;