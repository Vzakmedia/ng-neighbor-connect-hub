import { useState, useEffect } from 'react';
import { GoogleCalendarConfig } from '@/types/googleCalendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleCalendarConfig = () => {
  const [config, setConfig] = useState<GoogleCalendarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading Google Calendar config...');
      
      const { data, error } = await supabase.functions.invoke('get-google-calendar-config');
      
      console.log('Google Calendar config response:', { data, error });
      
      if (error) {
        console.error('Failed to load Google Calendar config:', error);
        
        let errorMessage = 'Google Calendar integration needs to be configured by an administrator';
        
        if (error.message?.includes('Authentication required')) {
          errorMessage = 'Please log in to access Google Calendar integration';
        } else if (error.message?.includes('configuration not found')) {
          errorMessage = 'Google Calendar API keys are not configured. Please contact an administrator.';
        }
        
        setError(errorMessage);
        toast({
          title: "Configuration Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.apiKey || !data.clientId) {
        console.error('Invalid Google Calendar config data:', data);
        const errorMessage = 'Google Calendar API configuration is missing required values';
        setError(errorMessage);
        toast({
          title: "Configuration Incomplete",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      console.log('Google Calendar config loaded successfully');
      setConfig(data);
      setError(null);
      
    } catch (error) {
      console.error('Failed to load Google Calendar config:', error);
      const errorMessage = 'Failed to load Google Calendar configuration';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    isLoading,
    error,
    reload: loadConfig
  };
};