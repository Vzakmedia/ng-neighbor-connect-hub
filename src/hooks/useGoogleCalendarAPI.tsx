import { useState, useCallback, useRef } from 'react';
import { GoogleCalendarConfig } from '@/types/googleCalendar';
import { GoogleCalendarLoader } from '@/utils/googleCalendarLoader';
import { useToast } from '@/hooks/use-toast';

export const useGoogleCalendarAPI = () => {
  const [apiLoaded, setApiLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const initializationRef = useRef(false);
  const { toast } = useToast();

  const initializeAPI = useCallback(async (config: GoogleCalendarConfig) => {
    // Prevent multiple initialization attempts
    if (isInitializing || initializationRef.current || apiLoaded) {
      console.log('GoogleCalendarAPI: Initialization already in progress or completed');
      return;
    }
    
    try {
      setIsInitializing(true);
      initializationRef.current = true;
      console.log('GoogleCalendarAPI: Starting initialization with config:', config);
      
      // Load the Google API script with better error handling
      console.log('GoogleCalendarAPI: Loading Google API script...');
      await GoogleCalendarLoader.loadGoogleAPI();
      console.log('GoogleCalendarAPI: Google API script loaded successfully');
      
      // Initialize gapi client
      console.log('GoogleCalendarAPI: Initializing GAPI client...');
      await initializeGapi(config);
      console.log('GoogleCalendarAPI: GAPI client initialized successfully');
      
      setApiLoaded(true);
      console.log('GoogleCalendarAPI: Full initialization completed successfully');
      
      toast({
        title: "Google Calendar Ready",
        description: "Google Calendar integration is now ready to use",
      });
      
    } catch (error) {
      console.error('GoogleCalendarAPI: Failed to initialize:', error);
      setApiLoaded(false);
      initializationRef.current = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Calendar Setup Failed",
        description: `Unable to initialize Google Calendar: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [toast]);

  const initializeGapi = async (config: GoogleCalendarConfig) => {
    console.log('Loading gapi client and auth2...');
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout loading Google API client'));
      }, 10000);

      window.gapi.load('client:auth2', {
        callback: () => {
          clearTimeout(timeout);
          console.log('GAPI client:auth2 loaded successfully');
          resolve();
        },
        onerror: (error: any) => {
          clearTimeout(timeout);
          console.error('Failed to load GAPI client:auth2:', error);
          reject(new Error('Failed to load Google API client'));
        }
      });
    });

    console.log('Initializing GAPI client with configuration...');

    try {
      await window.gapi.client.init({
        apiKey: config.apiKey,
        clientId: config.clientId,
        discoveryDocs: [config.discoveryDoc],
        scope: config.scopes
      });

      // Verify the auth instance is properly initialized
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Auth instance not created after initialization');
      }

      console.log('Google API client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google API client:', error);
      throw new Error(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetAPI = useCallback(() => {
    console.log('Resetting Google Calendar API state');
    setApiLoaded(false);
    setIsInitializing(false);
    initializationRef.current = false;
  }, []);

  return {
    apiLoaded,
    isInitializing,
    initializeAPI,
    resetAPI
  };
};