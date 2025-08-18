import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
}

export const useGoogleCalendar = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSignInStatus();
  }, []);

  const checkSignInStatus = () => {
    try {
      if (typeof window !== 'undefined' && window.gapi?.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance && authInstance.isSignedIn) {
          setIsSignedIn(authInstance.isSignedIn.get());
        }
      }
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      setIsSignedIn(false);
    }
  };

  const signIn = async () => {
    setIsLoading(true);
    try {
      if (!window.gapi?.auth2) {
        throw new Error('Google Auth API not properly initialized');
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Google Auth instance not available');
      }

      const user = await authInstance.signIn();
      if (user && authInstance.isSignedIn.get()) {
        setIsSignedIn(true);
        toast({
          title: "Connected to Google Calendar",
          description: "You can now sync your bookings with Google Calendar",
        });
      } else {
        throw new Error('Sign-in was not successful');
      }
    } catch (error) {
      console.error('Google Calendar sign-in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Connection Failed",
        description: `Failed to connect to Google Calendar: ${errorMessage}`,
        variant: "destructive",
      });
      setIsSignedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (window.gapi?.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance) {
          await authInstance.signOut();
        }
      }
      setIsSignedIn(false);
      
      toast({
        title: "Disconnected",
        description: "Google Calendar sync has been disabled",
      });
    } catch (error) {
      console.error('Google Calendar sign-out error:', error);
      setIsSignedIn(false);
    }
  };

  const createEvent = async (event: GoogleCalendarEvent) => {
    if (!isSignedIn) {
      throw new Error('Not signed in to Google Calendar');
    }

    try {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      return response.result;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  };

  const syncBookingToCalendar = async (booking: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
  }) => {
    if (!isSignedIn) return null;

    try {
      const event: GoogleCalendarEvent = {
        summary: `Service: ${booking.title}`,
        description: booking.description,
        start: {
          dateTime: booking.startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: booking.endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: booking.location,
      };

      const result = await createEvent(event);
      
      toast({
        title: "Event added to calendar",
        description: "Your booking has been synced to Google Calendar",
      });
      
      return result;
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync booking to Google Calendar",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    isSignedIn,
    isLoading,
    signIn,
    signOut,
    syncBookingToCalendar,
  };
};