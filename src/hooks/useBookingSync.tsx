import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';

interface UseBookingSyncProps {
  onBookingUpdated?: () => void;
  userId?: string;
}

export const useBookingSync = ({ onBookingUpdated, userId }: UseBookingSyncProps) => {
  const { toast } = useToast();
  const onBookingUpdatedRef = useRef(onBookingUpdated);

  // Keep ref in sync without adding it to subscription deps
  useEffect(() => {
    onBookingUpdatedRef.current = onBookingUpdated;
  });

  useEffect(() => {
    if (!userId) return;

    // Consolidated channel for all booking updates
    const subscription = createSafeSubscription(
      (channel) => {
        return channel
          // Client-side booking updates
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'service_bookings',
              filter: `client_id=eq.${userId}`
            },
            (payload: any) => {
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

              if (payload.eventType === 'INSERT') {
                toast({
                  title: "Booking Created",
                  description: "Your booking request has been submitted successfully",
                });
              }

              // Trigger refresh callback via ref to avoid stale closure
              onBookingUpdatedRef.current?.();
            }
          )
          // Provider-side booking updates
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'service_bookings',
              filter: `provider_id=eq.${userId}`
            },
            (payload: any) => {
              if (payload.eventType === 'INSERT') {
                toast({
                  title: "New Booking Request",
                  description: "You have received a new booking request",
                });
              }

              onBookingUpdatedRef.current?.();
            }
          );
      },
      {
        channelName: `booking-sync-${userId}`,
        debugName: 'BookingSync',
        pollInterval: 30000, // Poll every 30 seconds as fallback
        onError: () => {
          // Fallback: re-fetch bookings when real-time fails
          onBookingUpdatedRef.current?.();
        }
      }
    );

    return () => {
      cleanupSafeSubscription(subscription);
    };
  }, [userId, toast]);
};