import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Link, Unlink, Settings } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader } from '@googlemaps/js-api-loader';

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
      console.log('Loading Google Calendar config...');
      
      // Fetch Google Calendar configuration from edge function
      const { data, error } = await supabase.functions.invoke('get-google-calendar-config');
      
      console.log('Google Calendar config response:', { data, error });
      
      if (error) {
        console.error('Failed to load Google Calendar config:', error);
        
        // More specific error handling
        if (error.message?.includes('Authentication required')) {
          toast({
            title: "Authentication Error",
            description: "Please log in to access Google Calendar integration",
            variant: "destructive",
          });
        } else if (error.message?.includes('configuration not found')) {
          toast({
            title: "Configuration Missing",
            description: "Google Calendar API keys are not configured. Please contact an administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Configuration Required", 
            description: "Google Calendar integration needs to be configured by an administrator",
            variant: "destructive",
          });
        }
        return;
      }

      // Check if we got valid configuration data
      if (!data || !data.apiKey || !data.clientId) {
        console.error('Invalid Google Calendar config data:', data);
        toast({
          title: "Configuration Incomplete",
          description: "Google Calendar API configuration is missing required values",
          variant: "destructive",
        });
        return;
      }

      console.log('Google Calendar config loaded successfully');
      setConfig(data);
      
      // Load Google API after config is set
      await loadGoogleAPIWithConfig(data);
    } catch (error) {
      console.error('Failed to load Google Calendar config:', error);
      toast({
        title: "Error",
        description: "Failed to load Google Calendar configuration",
        variant: "destructive",
      });
    }
  };

  const loadGoogleAPIWithConfig = async (configData: GoogleCalendarConfig) => {
    try {
      console.log('Loading Google API with config:', configData);
      
      // Use a more reliable approach to load Google APIs
      if (!window.gapi) {
        console.log('Loading Google API using alternative method...');
        
        // Try multiple loading strategies
        try {
          // Method 1: Direct script injection with better error handling
          await loadGapiScript();
        } catch (scriptError) {
          console.warn('Direct script loading failed, trying alternative method:', scriptError);
          
          // Method 2: Using dynamic import as fallback
          try {
            await loadGapiAlternative();
          } catch (altError) {
            console.error('All loading methods failed:', altError);
            throw new Error('Unable to load Google Calendar API. Please check your network connection.');
          }
        }
        
        // Wait for gapi to be fully available
        let attempts = 0;
        while (!window.gapi && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.gapi) {
          throw new Error('Google API failed to initialize after loading');
        }
      }
      
      console.log('Google API available, initializing...');
      await initializeGapi(configData);
      
    } catch (error) {
      console.error('Failed to load Google API:', error);
      
      // Show user-friendly error message
      toast({
        title: "Connection Issue",
        description: "Unable to connect to Google Calendar. Please check your internet connection and try again.",
        variant: "destructive",
      });
      
      // Set a flag to allow retry
      setApiLoaded(false);
    }
  };

  const loadGapiScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Remove any existing failed scripts
      const existingScripts = document.querySelectorAll('script[src*="apis.google.com"]');
      existingScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = false;
      
      const timeout = setTimeout(() => {
        reject(new Error('Google API script loading timeout'));
      }, 15000);
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('Google API script loaded successfully via direct method');
        resolve();
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Google API script failed to load via direct method:', error);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  };

  const loadGapiAlternative = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Alternative: Create the script with different attributes
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js?callback=initGapi';
      script.async = true;
      
      // Create a global callback
      (window as any).initGapi = () => {
        console.log('Google API loaded via callback method');
        resolve();
        delete (window as any).initGapi;
      };
      
      const timeout = setTimeout(() => {
        reject(new Error('Alternative Google API loading timeout'));
      }, 15000);
      
      script.onload = () => {
        clearTimeout(timeout);
        // Callback should handle success
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  };

  const initializeGapi = async (configData: GoogleCalendarConfig) => {
    try {
      console.log('Initializing Google API with config:', configData);
      
      await new Promise((resolve, reject) => {
        window.gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject
        });
      });

      console.log('GAPI client:auth2 loaded, initializing client...');

      await window.gapi.client.init({
        apiKey: configData.apiKey,
        clientId: configData.clientId,
        discoveryDocs: [configData.discoveryDoc],
        scope: configData.scopes
      });

      setApiLoaded(true);
      console.log('Google API initialized successfully, apiLoaded set to true');
      
      toast({
        title: "Google Calendar Ready",
        description: "Google Calendar integration is now ready to use",
      });
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      setApiLoaded(false);
      toast({
        title: "Setup Required",
        description: "Google Calendar integration needs to be configured with API keys",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    console.log('Connect button clicked', { apiLoaded, isSignedIn, isLoading });
    
    if (!apiLoaded) {
      console.log('API not loaded yet');
      toast({
        title: "Not Ready",
        description: "Google Calendar API is still loading",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Attempting to sign in...');
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
            disabled={isLoading}
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