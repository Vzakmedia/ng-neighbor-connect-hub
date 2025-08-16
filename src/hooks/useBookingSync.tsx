import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseBookingSyncProps {
  onBookingUpdated?: () => void;
  userId?: string;
}

export const useBookingSync = ({ onBookingUpdated, userId }: UseBookingSyncProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // Listen for booking updates
    const bookingChannel = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_bookings',
          filter: `client_id=eq.${userId}`
        },
        (payload) => {
          console.log('Booking update received:', payload);
          
          // Show notification for booking status changes
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;
            
            if (oldStatus !== newStatus) {
              let message = '';
              switch (newStatus) {
                case 'confirmed':
                  message = 'Your booking has been confirmed!';
                  break;
                case 'cancelled':
                  message = 'Your booking has been cancelled';
                  break;
                case 'completed':
                  message = 'Your booking has been completed';
                  break;
                default:
                  message = `Your booking status has been updated to ${newStatus}`;
              }
              
              toast({
                title: "Booking Update",
                description: message,
              });
            }
          }
          
          // Trigger refresh callback
          onBookingUpdated?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_bookings',
          filter: `client_id=eq.${userId}`
        },
        (payload) => {
          console.log('New booking created:', payload);
          toast({
            title: "Booking Created",
            description: "Your booking request has been submitted successfully",
          });
          onBookingUpdated?.();
        }
      )
      .subscribe();

    // Listen for provider-side booking updates if user is a service provider
    const providerChannel = supabase
      .channel('provider-booking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_bookings',
          filter: `provider_id=eq.${userId}`
        },
        (payload) => {
          console.log('Provider booking update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Booking Request",
              description: "You have received a new booking request",
            });
          }
          
          onBookingUpdated?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(providerChannel);
    };
  }, [userId, onBookingUpdated, toast]);
};