import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link, Unlink } from 'lucide-react';

interface GoogleCalendarConnectionStatusProps {
  isSignedIn: boolean;
  isLoading: boolean;
  apiLoaded: boolean;
  isInitializing?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const GoogleCalendarConnectionStatus = ({
  isSignedIn,
  isLoading,
  apiLoaded,
  isInitializing = false,
  onConnect,
  onDisconnect
}: GoogleCalendarConnectionStatusProps) => {
  const handleConnect = () => {
    if (!apiLoaded && !isInitializing) {
      console.log('API not ready for connection - apiLoaded:', apiLoaded, 'isInitializing:', isInitializing);
      return;
    }
    console.log('Attempting to connect to Google Calendar');
    onConnect();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label>Connection Status</Label>
        <p className="text-sm text-muted-foreground">
          {isInitializing 
            ? 'Initializing Google Calendar...' 
            : isSignedIn 
              ? 'Connected to Google Calendar' 
              : !apiLoaded 
                ? 'Loading Google Calendar API...' 
                : 'Not connected'
          }
        </p>
      </div>
      <Button
        variant={isSignedIn ? "outline" : "default"}
        onClick={isSignedIn ? onDisconnect : handleConnect}
        disabled={isLoading || isInitializing || (!apiLoaded && !isSignedIn)}
      >
        {isLoading || isInitializing ? (
          isInitializing ? 'Initializing...' : 'Loading...'
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