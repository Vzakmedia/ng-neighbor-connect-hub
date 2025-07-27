import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Link, Unlink, Settings } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    gapi: any;
  }
}

const GOOGLE_CALENDAR_CONFIG = {
  apiKey: 'YOUR_GOOGLE_API_KEY', // This should be from env
  clientId: 'YOUR_GOOGLE_CLIENT_ID', // This should be from env
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  scopes: 'https://www.googleapis.com/auth/calendar.events'
};

interface GoogleCalendarSyncProps {
  onSyncEnabledChange?: (enabled: boolean) => void;
}

const GoogleCalendarSync = ({ onSyncEnabledChange }: GoogleCalendarSyncProps) => {
  const [apiLoaded, setApiLoaded] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const { isSignedIn, isLoading, signIn, signOut } = useGoogleCalendar();
  const { toast } = useToast();

  useEffect(() => {
    loadGoogleAPI();
  }, []);

  useEffect(() => {
    onSyncEnabledChange?.(isSignedIn && autoSync);
  }, [isSignedIn, autoSync, onSyncEnabledChange]);

  const loadGoogleAPI = async () => {
    try {
      // Load Google API script
      if (!window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = initializeGapi;
        document.head.appendChild(script);
      } else {
        initializeGapi();
      }
    } catch (error) {
      console.error('Failed to load Google API:', error);
      toast({
        title: "Error",
        description: "Failed to load Google Calendar integration",
        variant: "destructive",
      });
    }
  };

  const initializeGapi = async () => {
    try {
      await new Promise((resolve) => {
        window.gapi.load('client:auth2', resolve);
      });

      await window.gapi.client.init({
        apiKey: GOOGLE_CALENDAR_CONFIG.apiKey,
        clientId: GOOGLE_CALENDAR_CONFIG.clientId,
        discoveryDocs: [GOOGLE_CALENDAR_CONFIG.discoveryDoc],
        scope: GOOGLE_CALENDAR_CONFIG.scopes
      });

      setApiLoaded(true);
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      toast({
        title: "Setup Required",
        description: "Google Calendar integration needs to be configured with API keys",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    if (!apiLoaded) {
      toast({
        title: "Not Ready",
        description: "Google Calendar API is still loading",
        variant: "destructive",
      });
      return;
    }
    await signIn();
  };

  const handleDisconnect = async () => {
    await signOut();
    setAutoSync(false);
  };

  const handleAutoSyncChange = (enabled: boolean) => {
    setAutoSync(enabled);
    if (enabled && !isSignedIn) {
      toast({
        title: "Connect Required",
        description: "Please connect to Google Calendar first",
        variant: "destructive",
      });
      return;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Sync
        </CardTitle>
        <CardDescription>
          Automatically sync your service bookings with Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Connection Status</Label>
            <p className="text-sm text-muted-foreground">
              {isSignedIn ? 'Connected to Google Calendar' : 'Not connected'}
            </p>
          </div>
          <Button
            variant={isSignedIn ? "outline" : "default"}
            onClick={isSignedIn ? handleDisconnect : handleConnect}
            disabled={isLoading || !apiLoaded}
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

        {isSignedIn && (
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
        )}

        {!apiLoaded && (
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Google Calendar integration requires API configuration. Please contact your administrator.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSync;