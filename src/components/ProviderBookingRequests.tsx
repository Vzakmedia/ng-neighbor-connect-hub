import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MessageSquare, Star, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingSync } from '@/hooks/useBookingSync';

interface BookingRequest {
  id: string;
  booking_date: string;
  status: string;
  message: string | null;
  created_at: string;
  client_id: string;
  service: {
    id: string;
    title: string;
    description: string;
  } | null;
  client: {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

const ProviderBookingRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookingRequests = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          id,
          booking_date,
          status,
          message,
          created_at,
          client_id,
          service_id,
          services!service_bookings_service_id_fkey(id, title, description),
          client:profiles!service_bookings_client_id_fkey(full_name, avatar_url, phone)
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Booking requests fetch error:', error);
        throw error;
      }
      
      // Transform the data to match our interface
      const transformedRequests = (data || []).map(request => ({
        id: request.id,
        booking_date: request.booking_date,
        status: request.status,
        message: request.message,
        created_at: request.created_at,
        client_id: request.client_id,
        service: request.services,
        client: request.client,
      }));

      // Filter out requests with missing relationships
      const validRequests = transformedRequests.filter(request => {
        if (!request.service) {
          console.warn('Booking request missing service data:', request.id);
          return false;
        }
        if (!request.client) {
          console.warn('Booking request missing client profile:', request.id);
          return false;
        }
        return true;
      });
      
      setBookingRequests(validRequests as BookingRequest[]);
    } catch (error: any) {
      console.error('Error fetching booking requests:', error);
      
      let errorMessage = 'Failed to load booking requests';
      if (error.message?.includes('foreign key') || error.code === 'PGRST200') {
        errorMessage = 'Some booking request information is incomplete. Showing available requests.';
        // Try to fetch without joins as fallback
        try {
          const { data: basicData } = await supabase
            .from('service_bookings')
            .select('*')
            .eq('provider_id', user.id)
            .order('created_at', { ascending: false });
          
          if (basicData && basicData.length > 0) {
            // Set requests with partial data
            const partialRequests = basicData.map(request => ({
              id: request.id,
              booking_date: request.booking_date,
              status: request.status,
              message: request.message,
              created_at: request.created_at,
              client_id: request.client_id,
              service: { id: '', title: 'Service', description: '' },
              client: { full_name: 'Client', avatar_url: null, phone: null },
            }));
            setBookingRequests(partialRequests as any);
            console.warn('Loading booking requests with partial data - some details may be missing');
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
        console.warn('Skipping booking requests with incomplete data');
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Use real-time booking sync
  useBookingSync({ 
    onBookingUpdated: fetchBookingRequests, 
    userId: user?.id 
  });


  const handleStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    setUpdating(bookingId);
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)
        .eq('provider_id', user!.id);

      if (error) throw error;

      toast({
        title: "Booking Updated",
        description: `Booking has been ${newStatus}`,
      });

      fetchBookingRequests();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
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

  if (bookingRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No booking requests</h3>
        <p className="text-muted-foreground">Booking requests for your services will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Booking Requests</h2>
        <Button variant="outline" onClick={fetchBookingRequests} size="sm">
          Refresh
        </Button>
      </div>

      {bookingRequests.map((request) => {
        const { date, time } = formatDateTime(request.booking_date);
        
        return (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{request.service?.title || 'Service'}</CardTitle>
                  <CardDescription>Booking request from {request.client?.full_name || 'Client'}</CardDescription>
                </div>
                <Badge variant={getStatusColor(request.status)} className="capitalize">
                  {request.status}
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
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{request.client?.full_name || 'Client'}</span>
                </div>
              </div>

              {request.message && (
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Client message:</p>
                    <p className="text-sm text-muted-foreground">{request.message}</p>
                  </div>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusUpdate(request.id, 'confirmed')}
                    disabled={updating === request.id}
                    size="sm"
                    className="flex-1"
                  >
                    {updating === request.id ? 'Updating...' : 'Confirm Booking'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdate(request.id, 'cancelled')}
                    disabled={updating === request.id}
                    size="sm"
                    className="flex-1"
                  >
                    {updating === request.id ? 'Updating...' : 'Decline'}
                  </Button>
                </div>
              )}

              {request.status === 'confirmed' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusUpdate(request.id, 'completed')}
                    disabled={updating === request.id}
                    size="sm"
                    variant="outline"
                  >
                    {updating === request.id ? 'Updating...' : 'Mark as Completed'}
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

export default ProviderBookingRequests;