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
    if (typeof window !== 'undefined' && window.gapi) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance) {
        setIsSignedIn(authInstance.isSignedIn.get());
      }
    }
  };

  const signIn = async () => {
    setIsLoading(true);
    try {
      if (!window.gapi) {
        throw new Error('Google API not loaded');
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      setIsSignedIn(true);
      
      toast({
        title: "Connected to Google Calendar",
        description: "You can now sync your bookings with Google Calendar",
      });
    } catch (error) {
      console.error('Google Calendar sign-in error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      setIsSignedIn(false);
      
      toast({
        title: "Disconnected",
        description: "Google Calendar sync has been disabled",
      });
    } catch (error) {
      console.error('Google Calendar sign-out error:', error);
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