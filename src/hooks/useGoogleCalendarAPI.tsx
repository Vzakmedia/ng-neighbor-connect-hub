import { useState, useCallback } from 'react';
import { GoogleCalendarConfig } from '@/types/googleCalendar';
import { GoogleCalendarLoader } from '@/utils/googleCalendarLoader';
import { useToast } from '@/hooks/use-toast';

export const useGoogleCalendarAPI = () => {
  const [apiLoaded, setApiLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  const initializeAPI = useCallback(async (config: GoogleCalendarConfig) => {
    if (isInitializing) return;
    
    try {
      setIsInitializing(true);
      console.log('Initializing Google Calendar API with config:', config);
      
      // Load the Google API script
      await GoogleCalendarLoader.loadGoogleAPI();
      
      // Initialize gapi client
      await initializeGapi(config);
      
      setApiLoaded(true);
      toast({
        title: "Google Calendar Ready",
        description: "Google Calendar integration is now ready to use",
      });
      
    } catch (error) {
      console.error('Failed to initialize Google Calendar API:', error);
      setApiLoaded(false);
      
      toast({
        title: "Connection Issue",
        description: "Unable to connect to Google Calendar. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, toast]);

  const initializeGapi = async (config: GoogleCalendarConfig) => {
    await new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', {
        callback: resolve,
        onerror: reject
      });
    });

    console.log('GAPI client:auth2 loaded, initializing client...');

    await window.gapi.client.init({
      apiKey: config.apiKey,
      clientId: config.clientId,
      discoveryDocs: [config.discoveryDoc],
      scope: config.scopes
    });

    console.log('Google API initialized successfully');
  };

  const resetAPI = useCallback(() => {
    setApiLoaded(false);
    setIsInitializing(false);
  }, []);

  return {
    apiLoaded,
    isInitializing,
    initializeAPI,
    resetAPI
  };
};