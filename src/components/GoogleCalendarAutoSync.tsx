import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface GoogleCalendarAutoSyncProps {
  isSignedIn: boolean;
  autoSync: boolean;
  onAutoSyncChange: (enabled: boolean) => void;
}

export const GoogleCalendarAutoSync = ({
  isSignedIn,
  autoSync,
  onAutoSyncChange
}: GoogleCalendarAutoSyncProps) => {
  const { toast } = useToast();

  const handleAutoSyncChange = (enabled: boolean) => {
    if (enabled && !isSignedIn) {
      toast({
        title: "Connect Required",
        description: "Please connect to Google Calendar first",
        variant: "destructive",
      });
      return;
    }
    onAutoSyncChange(enabled);
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label htmlFor="auto-sync">Auto-sync bookings</Label>
        <p className="text-sm text-muted-foreground">
          Automatically add new bookings to your calendar
        </p>
      </div>
      <Switch
        id="auto-sync"
        checked={autoSync}
        onCheckedChange={handleAutoSyncChange}
      />
    </div>
  );
};