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
      console.log('API initialization already in progress or completed');
      return;
    }
    
    try {
      setIsInitializing(true);
      initializationRef.current = true;
      console.log('Starting Google Calendar API initialization with config:', config);
      
      // Load the Google API script
      await GoogleCalendarLoader.loadGoogleAPI();
      
      // Initialize gapi client
      await initializeGapi(config);
      
      setApiLoaded(true);
      console.log('Google Calendar API initialization completed successfully');
      
      toast({
        title: "Google Calendar Ready",
        description: "Google Calendar integration is now ready to use",
      });
      
    } catch (error) {
      console.error('Failed to initialize Google Calendar API:', error);
      setApiLoaded(false);
      initializationRef.current = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Connection Issue",
        description: `Unable to connect to Google Calendar: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [toast]);

  const initializeGapi = async (config: GoogleCalendarConfig) => {
    console.log('Loading gapi client and auth2...');
    
    await new Promise<void>((resolve, reject) => {
      window.gapi.load('client:auth2', {
        callback: () => {
          console.log('GAPI client:auth2 loaded successfully');
          resolve();
        },
        onerror: (error: any) => {
          console.error('Failed to load GAPI client:auth2:', error);
          reject(new Error('Failed to load Google API client'));
        }
      });
    });

    console.log('Initializing GAPI client with configuration...');

    await window.gapi.client.init({
      apiKey: config.apiKey,
      clientId: config.clientId,
      discoveryDocs: [config.discoveryDoc],
      scope: config.scopes
    });

    console.log('Google API client initialized successfully');
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