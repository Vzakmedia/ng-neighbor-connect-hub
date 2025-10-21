import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingSync } from '@/hooks/useBookingSync';

interface Booking {
  id: string;
  booking_date: string;
  status: string;
  message: string | null;
  created_at: string;
  service: {
    id: string;
    title: string;
    description: string;
    location: string | null;
  } | null;
  provider: {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

const MyBookingsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          id,
          booking_date,
          status,
          message,
          created_at,
          service_id,
          provider_id,
          services!service_bookings_service_id_fkey(id, title, description, location),
          provider:profiles!service_bookings_provider_id_fkey(full_name, avatar_url, phone)
        `)
        .eq('client_id', user!.id)
        .order('booking_date', { ascending: true });

      if (error) {
        console.error('Bookings fetch error:', error);
        throw error;
      }
      
      // Transform the data to match our interface
      const transformedBookings = (data || []).map(booking => ({
        id: booking.id,
        booking_date: booking.booking_date,
        status: booking.status,
        message: booking.message,
        created_at: booking.created_at,
        service: booking.services,
        provider: booking.provider,
      }));

      // Filter out bookings with missing relationships
      const validBookings = transformedBookings.filter(booking => {
        if (!booking.service) {
          console.warn('Booking missing service data:', booking.id);
          return false;
        }
        if (!booking.provider) {
          console.warn('Booking missing provider profile:', booking.id);
          return false;
        }
        return true;
      });
      
      setBookings(validBookings as Booking[]);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      
      let errorMessage = 'Failed to load your bookings';
      if (error.message?.includes('foreign key') || error.code === 'PGRST200') {
        errorMessage = 'Some booking information is incomplete. Showing available bookings.';
        // Try to fetch without joins as fallback
        try {
          const { data: basicData } = await supabase
            .from('service_bookings')
            .select('*')
            .eq('client_id', user!.id)
            .order('booking_date', { ascending: true });
          
          if (basicData && basicData.length > 0) {
            // Set bookings with partial data
            const partialBookings = basicData.map(booking => ({
              id: booking.id,
              booking_date: booking.booking_date,
              status: booking.status,
              message: booking.message,
              created_at: booking.created_at,
              service: { id: '', title: 'Service', description: '', location: null },
              provider: { full_name: 'Provider', avatar_url: null, phone: null },
            }));
            setBookings(partialBookings as any);
            console.warn('Loading bookings with partial data - some details may be missing');
            setLoading(false);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      }

      // Only show error toast if it's a real failure (not orphaned data)
      if (!errorMessage.includes('incomplete')) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.warn('Skipping bookings with incomplete data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Use real-time booking sync
  useBookingSync({ 
    onBookingUpdated: fetchBookings, 
    userId: user?.id 
  });

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);


  const handleCancelBooking = async (bookingId: string) => {
    setCancelling(bookingId);
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('client_id', user!.id);

      if (error) throw error;

      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully",
      });

      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'hh:mm a')
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
        <p className="text-muted-foreground">Your service bookings will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Bookings</h2>
        <Button variant="outline" onClick={fetchBookings} size="sm">
          Refresh
        </Button>
      </div>

      {bookings.map((booking) => {
        const { date, time } = formatDateTime(booking.booking_date);
        
        return (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{booking.service?.title || 'Service'}</CardTitle>
                  <CardDescription>{booking.service?.description || 'Service description'}</CardDescription>
                </div>
                <Badge variant={getStatusColor(booking.status)} className="capitalize">
                  {booking.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{time}</span>
                </div>
                {booking.service?.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.service.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.provider?.full_name || 'Service Provider'}</span>
                </div>
              </div>

              {booking.message && (
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Your message:</p>
                    <p className="text-sm text-muted-foreground">{booking.message}</p>
                  </div>
                </div>
              )}

              {booking.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancelling === booking.id}
                  >
                    {cancelling === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MyBookingsPanel;