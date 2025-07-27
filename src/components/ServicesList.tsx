import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import ManageAvailabilityDialog from './ManageAvailabilityDialog';
import EditServiceDialog from './EditServiceDialog';
import { formatTimeAgo } from '@/lib/utils';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price_min: number | null;
  price_max: number | null;
  location: string | null;
  is_active: boolean;
  rating: number | null;
  total_reviews: number | null;
  created_at: string;
  user_id: string;
  images: string[];
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface Booking {
  id: string;
  booking_date: string;
  status: string;
  message: string | null;
  created_at: string;
  services: {
    title: string;
    description: string;
  };
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface ServicesListProps {
  onRefresh: boolean;
}

const ServicesList = ({ onRefresh }: ServicesListProps) => {
  console.log('ServicesList component rendering...');
  const { user } = useAuth();
  const { toast } = useToast();
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-services');

  console.log('ServicesList state:', { myServices: myServices.length, myBookings: myBookings.length, loading, activeTab });


  const fetchMyServices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const servicesWithProfiles = await Promise.all(
        (data || []).map(async (service) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', service.user_id)
            .single();

          return {
            ...service,
            profiles: profile || { full_name: 'Anonymous', avatar_url: '' }
          };
        })
      );

      setMyServices(servicesWithProfiles as any || []);
    } catch (error) {
      console.error('Error fetching my services:', error);
      toast({
        title: "Error",
        description: "Failed to load your services",
        variant: "destructive",
      });
    }
  };

  const fetchMyBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch services and profiles separately
      const bookingsWithRelations = await Promise.all(
        (data || []).map(async (booking) => {
          const [serviceData, profileData] = await Promise.all([
            supabase
              .from('services')
              .select('title, description')
              .eq('id', booking.service_id)
              .single(),
            supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', booking.provider_id)
              .single()
          ]);

          return {
            ...booking,
            services: serviceData.data || { title: 'Unknown Service', description: '' },
            profiles: profileData.data || { full_name: 'Anonymous', avatar_url: '' }
          };
        })
      );

      setMyBookings(bookingsWithRelations as any || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string, serviceTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${serviceTitle}"?`)) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service deleted",
        description: "Your service has been successfully deleted",
      });

      fetchMyServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Service ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchMyServices();
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMyServices(), fetchMyBookings()]);
      setLoading(false);
    };

    loadData();
  }, [user, onRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="my-services">My Services</TabsTrigger>
        <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
      </TabsList>


      <TabsContent value="my-services" className="space-y-4">
        {myServices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">You haven't created any services yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myServices.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          {service.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        <Badge variant={service.is_active ? "default" : "destructive"}>
                          {service.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <EditServiceDialog service={service} onServiceUpdated={fetchMyServices}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </EditServiceDialog>
                      <ManageAvailabilityDialog service={{ id: service.id, title: service.title }}>
                        <Button variant="outline" size="sm">
                          <Clock className="h-4 w-4 mr-1" />
                          Availability
                        </Button>
                      </ManageAvailabilityDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                      >
                        {service.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteService(service.id, service.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                  
                  {/* Service Gallery */}
                  {service.images && service.images.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {service.images.slice(0, 3).map((imageUrl, index) => (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`${service.title} gallery ${index + 1}`}
                          className="w-16 h-16 object-cover rounded flex-shrink-0"
                        />
                      ))}
                      {service.images.length > 3 && (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                          +{service.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {service.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      {service.location}
                    </div>
                  )}

                  {(service.price_min || service.price_max) && (
                    <div className="text-lg font-semibold mb-2">
                      ₦{service.price_min || 0} - ₦{service.price_max || 0}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Created {formatTimeAgo(service.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="my-bookings" className="space-y-4">
        {myBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No bookings yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{booking.services?.title}</CardTitle>
                      <Badge variant={
                        booking.status === 'confirmed' ? "default" :
                        booking.status === 'pending' ? "secondary" : "destructive"
                      }>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Booked {formatTimeAgo(booking.created_at)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {booking.services?.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={booking.profiles?.avatar_url || ""} />
                      <AvatarFallback>
                        {booking.profiles?.full_name?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <span>Provider: {booking.profiles?.full_name || "Service Provider"}</span>
                  </div>

                  {booking.message && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{booking.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ServicesList;