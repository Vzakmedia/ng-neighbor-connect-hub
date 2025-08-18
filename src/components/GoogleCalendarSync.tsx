import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Settings } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useGoogleCalendarConfig } from '@/hooks/useGoogleCalendarConfig';
import { useGoogleCalendarAPI } from '@/hooks/useGoogleCalendarAPI';
import { GoogleCalendarConnectionStatus } from '@/components/GoogleCalendarConnectionStatus';
import { GoogleCalendarAutoSync } from '@/components/GoogleCalendarAutoSync';
import { GoogleCalendarSyncProps } from '@/types/googleCalendar';

const GoogleCalendarSync = ({ onSyncEnabledChange }: GoogleCalendarSyncProps) => {
  const [autoSync, setAutoSync] = useState(false);
  
  const { config, isLoading: configLoading, error: configError } = useGoogleCalendarConfig();
  const { apiLoaded, isInitializing, initializeAPI } = useGoogleCalendarAPI();
  const { isSignedIn, isLoading: authLoading, signIn, signOut } = useGoogleCalendar();

  // Initialize API when config is loaded
  useEffect(() => {
    if (config && !apiLoaded && !isInitializing) {
      initializeAPI(config);
    }
  }, [config, apiLoaded, isInitializing, initializeAPI]);

  // Notify parent component when sync status changes
  useEffect(() => {
    onSyncEnabledChange?.(isSignedIn && autoSync);
  }, [isSignedIn, autoSync, onSyncEnabledChange]);

  const handleConnect = async () => {
    console.log('Connect button clicked', { apiLoaded, isSignedIn, authLoading });
    await signIn();
  };

  const handleDisconnect = async () => {
    await signOut();
    setAutoSync(false);
  };

  const handleAutoSyncChange = (enabled: boolean) => {
    setAutoSync(enabled);
  };

  const isLoading = configLoading || authLoading || isInitializing;

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
        <GoogleCalendarConnectionStatus
          isSignedIn={isSignedIn}
          isLoading={isLoading}
          apiLoaded={apiLoaded}
          isInitializing={isInitializing}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />

        <GoogleCalendarAutoSync
          isSignedIn={isSignedIn}
          autoSync={autoSync}
          onAutoSyncChange={handleAutoSyncChange}
        />

        {configError && (
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">{configError}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSync;