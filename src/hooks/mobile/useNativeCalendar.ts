import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

// Note: This requires @capacitor-community/calendar plugin
// Install with: npm install @capacitor-community/calendar

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  notes?: string;
}

export const useNativeCalendar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const requestPermission = async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      // @ts-ignore - Plugin not installed yet
      const { Calendar } = await import('@capacitor-community/calendar');
      const result = await Calendar.requestPermissions();
      return result.granted;
    } catch (error) {
      console.error('Calendar permission error:', error);
      return false;
    }
  };

  const checkPermission = async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      // @ts-ignore - Plugin not installed yet
      const { Calendar } = await import('@capacitor-community/calendar');
      const result = await Calendar.checkPermissions();
      return result.granted;
    } catch (error) {
      console.error('Calendar permission check error:', error);
      return false;
    }
  };

  const createEvent = async (event: CalendarEvent): Promise<string | null> => {
    if (!isNative) {
      toast({
        title: 'Not Available',
        description: 'Native calendar integration is only available on mobile',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      // Check/request permission
      const hasPermission = await checkPermission();
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          toast({
            title: 'Permission Denied',
            description: 'Calendar access is required to sync events',
            variant: 'destructive',
          });
          return null;
        }
      }

      // @ts-ignore - Plugin not installed yet
      const { Calendar } = await import('@capacitor-community/calendar');
      
      const result = await Calendar.createEvent({
        title: event.title,
        notes: event.description || event.notes,
        location: event.location,
        startDate: event.startDate.getTime(),
        endDate: event.endDate.getTime(),
        isAllDay: event.allDay || false,
      });

      if (result.result) {
        toast({
          title: 'Event Added',
          description: `"${event.title}" has been added to your calendar`,
        });
        return result.result;
      }

      return null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to add event to calendar',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const syncBookingToCalendar = async (booking: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
  }) => {
    return createEvent({
      title: `Service: ${booking.title}`,
      description: booking.description,
      location: booking.location,
      startDate: new Date(booking.startDateTime),
      endDate: new Date(booking.endDateTime),
    });
  };

  return {
    isNative,
    isLoading,
    requestPermission,
    checkPermission,
    createEvent,
    syncBookingToCalendar,
  };
};
