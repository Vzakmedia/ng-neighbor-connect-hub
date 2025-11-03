import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Settings, Smartphone } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useGoogleCalendarConfig } from '@/hooks/useGoogleCalendarConfig';
import { useGoogleCalendarAPI } from '@/hooks/useGoogleCalendarAPI';
import { useNativeCalendar } from '@/hooks/mobile/useNativeCalendar';
import { GoogleCalendarConnectionStatus } from '@/components/GoogleCalendarConnectionStatus';
import { GoogleCalendarAutoSync } from '@/components/GoogleCalendarAutoSync';
import { GoogleCalendarSyncProps } from '@/types/googleCalendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const GoogleCalendarSync = ({ onSyncEnabledChange }: GoogleCalendarSyncProps) => {
  const [autoSync, setAutoSync] = useState(false);
  const [nativeCalendarEnabled, setNativeCalendarEnabled] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  
  // Google Calendar (web only)
  const { config, isLoading: configLoading, error: configError } = useGoogleCalendarConfig();
  const { apiLoaded, isInitializing, initializeAPI } = useGoogleCalendarAPI();
  const { isSignedIn, isLoading: authLoading, signIn, signOut } = useGoogleCalendar();
  
  // Native Calendar (mobile only)
  const nativeCalendar = useNativeCalendar();

  // Initialize Google Calendar API when config is loaded (web only)
  useEffect(() => {
    if (!isNative && config && !apiLoaded && !isInitializing) {
      console.log('Starting Google Calendar API initialization...');
      initializeAPI(config);
    }
  }, [isNative, config, apiLoaded, isInitializing, initializeAPI]);

  // Notify parent component when sync status changes
  useEffect(() => {
    const syncEnabled = isNative 
      ? nativeCalendarEnabled 
      : (isSignedIn && autoSync);
    onSyncEnabledChange?.(syncEnabled);
  }, [isNative, isSignedIn, autoSync, nativeCalendarEnabled, onSyncEnabledChange]);

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

  const handleNativeCalendarToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await nativeCalendar.requestPermission();
      if (granted) {
        setNativeCalendarEnabled(true);
      }
    } else {
      setNativeCalendarEnabled(false);
    }
  };

  const isLoading = configLoading || authLoading || isInitializing || nativeCalendar.isLoading;

  // PHASE 16 OPTION A: Hide Google Calendar on native, show native calendar instead
  if (isNative) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Native Calendar Sync
          </CardTitle>
          <CardDescription>
            Sync your service bookings with your device's calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              On mobile, events are synced directly to your device's native calendar app.
              This works with iOS Calendar, Google Calendar on Android, and other calendar apps.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="native-sync">Auto-sync bookings</Label>
              <p className="text-sm text-muted-foreground">
                Automatically add new bookings to your calendar
              </p>
            </div>
            <Switch
              id="native-sync"
              checked={nativeCalendarEnabled}
              onCheckedChange={handleNativeCalendarToggle}
              disabled={isLoading}
            />
          </div>

          {nativeCalendarEnabled && (
            <Alert className="bg-primary/10 border-primary/20">
              <Calendar className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                Calendar sync is enabled. New bookings will be added to your device calendar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // PHASE 16: Web version - Keep Google Calendar integration
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