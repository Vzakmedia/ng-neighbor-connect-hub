import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link, Unlink } from 'lucide-react';

interface GoogleCalendarConnectionStatusProps {
  isSignedIn: boolean;
  isLoading: boolean;
  apiLoaded: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const GoogleCalendarConnectionStatus = ({
  isSignedIn,
  isLoading,
  apiLoaded,
  onConnect,
  onDisconnect
}: GoogleCalendarConnectionStatusProps) => {
  const handleConnect = () => {
    if (!apiLoaded) {
      return;
    }
    onConnect();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label>Connection Status</Label>
        <p className="text-sm text-muted-foreground">
          {isSignedIn ? 'Connected to Google Calendar' : 'Not connected'}
        </p>
      </div>
      <Button
        variant={isSignedIn ? "outline" : "default"}
        onClick={isSignedIn ? onDisconnect : handleConnect}
        disabled={isLoading || (!apiLoaded && !isSignedIn)}
      >
        {isLoading ? (
          'Loading...'
        ) : isSignedIn ? (
          <>
            <Unlink className="h-4 w-4 mr-2" />
            Disconnect
          </>
        ) : (
          <>
            <Link className="h-4 w-4 mr-2" />
            Connect
          </>
        )}
      </Button>
    </div>
  );
};