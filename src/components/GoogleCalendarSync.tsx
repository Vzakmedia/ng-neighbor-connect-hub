import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Link, Unlink, Settings } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    gapi: any;
  }
}

interface GoogleCalendarConfig {
  apiKey: string;
  clientId: string;
  discoveryDoc: string;
  scopes: string;
}

interface GoogleCalendarSyncProps {
  onSyncEnabledChange?: (enabled: boolean) => void;
}

const GoogleCalendarSync = ({ onSyncEnabledChange }: GoogleCalendarSyncProps) => {
  const [apiLoaded, setApiLoaded] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [config, setConfig] = useState<GoogleCalendarConfig | null>(null);
  const { isSignedIn, isLoading, signIn, signOut } = useGoogleCalendar();
  const { toast } = useToast();

  useEffect(() => {
    loadGoogleCalendarConfig();
  }, []);

  useEffect(() => {
    onSyncEnabledChange?.(isSignedIn && autoSync);
  }, [isSignedIn, autoSync, onSyncEnabledChange]);

  const loadGoogleCalendarConfig = async () => {
    try {
      // Fetch Google Calendar configuration from edge function
      const { data, error } = await supabase.functions.invoke('get-google-calendar-config');
      
      if (error) {
        console.error('Failed to load Google Calendar config:', error);
        toast({
          title: "Configuration Required",
          description: "Google Calendar integration needs to be configured by an administrator",
          variant: "destructive",
        });
        return;
      }

      setConfig(data);
      loadGoogleAPI();
    } catch (error) {
      console.error('Failed to load Google Calendar config:', error);
      toast({
        title: "Error",
        description: "Failed to load Google Calendar configuration",
        variant: "destructive",
      });
    }
  };

  const loadGoogleAPI = async () => {
    if (!config) return;
    
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
    if (!config) return;
    
    try {
      await new Promise((resolve) => {
        window.gapi.load('client:auth2', resolve);
      });

      await window.gapi.client.init({
        apiKey: config.apiKey,
        clientId: config.clientId,
        discoveryDocs: [config.discoveryDoc],
        scope: config.scopes
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

        {!config && (
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