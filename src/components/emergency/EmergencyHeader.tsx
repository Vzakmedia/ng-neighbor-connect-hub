import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import PanicButton from '../PanicButton';
import ReportIncidentDialog from '../ReportIncidentDialog';
import { useProfile } from '@/hooks/useProfile';

const EmergencyHeader = () => {
  const { profile } = useProfile();
  
  const getLocationText = () => {
    if (profile?.neighborhood) {
      return `Alerts in ${profile.neighborhood}`;
    } else if (profile?.city) {
      return `Alerts in ${profile.city}`;
    } else if (profile?.state) {
      return `Alerts in ${profile.state}`;
    }
    return 'Safety Center';
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl md:text-2xl font-bold">{getLocationText()}</h1>
      <div className="flex items-center gap-2">
        <PanicButton />
        <ReportIncidentDialog
          trigger={
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Report Incident
            </Button>
          }
        />
        <ReportIncidentDialog
          trigger={
            <Button variant="outline" size="sm" className="sm:hidden h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default EmergencyHeader;