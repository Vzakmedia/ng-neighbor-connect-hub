import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Download, 
  Play, 
  Image as ImageIcon,
  FileIcon,
  ExternalLink
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import RSVPDialog from '@/components/RSVPDialog';

interface Event {
  id: string;
  title: string;
  content: string;
  location: string;
  tags: string[];
  created_at: string;
  rsvp_enabled: boolean;
  file_urls?: any[];
  image_urls?: string[];
  user_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface RSVP {
  id: string;
  user_id: string;
  status: 'going' | 'interested' | 'not_going';
  message?: string;
  created_at: string;
  full_name?: string;
  phone_number?: string;
  email_address?: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface ViewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

const ViewEventDialog = ({ open, onOpenChange, event }: ViewEventDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, interested: 0, not_going: 0 });
  const [userRsvp, setUserRsvp] = useState<RSVP | null>(null);
  const [showRsvpDialog, setShowRsvpDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);

  const fetchRsvps = async () => {
    if (!event || !event.rsvp_enabled) return;

    try {
      setLoading(true);
      const { data: rsvpData, error } = await supabase
        .from('event_rsvps')
        .select(`
          id,
          user_id,
          status,
          message,
          created_at,
          full_name,
          phone_number,
          email_address,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rsvpsWithProfiles = (rsvpData || []).map(rsvp => ({
        ...rsvp,
        profiles: rsvp.profiles || { full_name: 'Anonymous', avatar_url: '' }
      })) as RSVP[];

      setRsvps(rsvpsWithProfiles);

      // Calculate counts
      const going = rsvpsWithProfiles.filter(r => r.status === 'going').length;
      const interested = rsvpsWithProfiles.filter(r => r.status === 'interested').length;
      const not_going = rsvpsWithProfiles.filter(r => r.status === 'not_going').length;
      
      setRsvpCounts({ going, interested, not_going });

      // Find user's RSVP
      const currentUserRsvp = rsvpsWithProfiles.find(r => r.user_id === user?.id);
      setUserRsvp(currentUserRsvp || null);

    } catch (error) {
      console.error('Error fetching RSVPs:', error);
      toast({
        title: "Error",
        description: "Failed to load RSVPs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    if (!event?.location || !mapContainer.current) return;

    try {
      // Get Google Maps API key from Supabase function
      const { data, error } = await supabase.functions.invoke('get-google-maps-token');
      
      if (error) {
        console.error('Error getting API key:', error);
        return;
      }

      const apiKey = data?.token;
      if (!apiKey) {
        console.error('No API key received');
        return;
      }

      // Dynamically load Google Maps API
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
          initMap();
        };
      } else {
        initMap();
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const initMap = () => {
    if (!window.google || !mapContainer.current || !event?.location) return;

    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: event.location }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        
        const map = new window.google.maps.Map(mapContainer.current!, {
          zoom: 15,
          center: location,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        new window.google.maps.Marker({
          position: location,
          map: map,
          title: event.title,
        });
      }
    });
  };

  const handleRsvpSuccess = () => {
    fetchRsvps();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-5 w-5" />;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return <Play className="h-5 w-5" />;
    } else {
      return <FileIcon className="h-5 w-5" />;
    }
  };

  const downloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (open && event) {
      fetchRsvps();
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [open, event]);

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Creator Info */}
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={event.profiles?.avatar_url || ""} />
              <AvatarFallback>
                {event.profiles?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{event.profiles?.full_name || "Anonymous"}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTimeAgo(event.created_at)}
              </p>
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="rsvps">RSVPs ({rsvpCounts.going + rsvpCounts.interested})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Event Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{event.content}</p>
                  
                  {event.location && (
                    <div className="flex items-center gap-2 mt-4 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* RSVP Actions */}
              {event.rsvp_enabled && user && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      RSVP to this Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Badge variant="default">{rsvpCounts.going}</Badge>
                        <span>Going</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary">{rsvpCounts.interested}</Badge>
                        <span>Interested</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{rsvpCounts.not_going}</Badge>
                        <span>Not Going</span>
                      </div>
                    </div>

                    {userRsvp ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">
                            You've RSVP'd as: <Badge variant="outline">{userRsvp.status.replace('_', ' ')}</Badge>
                          </p>
                          {userRsvp.message && (
                            <p className="text-xs text-muted-foreground mt-1">"{userRsvp.message}"</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRsvpDialog(true)}
                        >
                          Update RSVP
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowRsvpDialog(true)}
                        className="w-full"
                      >
                        RSVP to Event
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              {event.location ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Event Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{event.location}</p>
                    <div 
                      ref={mapContainer} 
                      className="w-full h-64 rounded-lg bg-muted"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No location specified for this event</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              {/* Images */}
              {event.image_urls && event.image_urls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {event.image_urls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Event image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Files */}
              {event.file_urls && event.file_urls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Files & Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {event.file_urls.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.name)}
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(file.url, file.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(!event.image_urls || event.image_urls.length === 0) && 
               (!event.file_urls || event.file_urls.length === 0) && (
                <Card>
                  <CardContent className="text-center py-8">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No media files attached to this event</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rsvps" className="space-y-4">
              {event.rsvp_enabled ? (
                loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : rsvps.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No RSVPs yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {rsvps.map((rsvp) => (
                      <Card key={rsvp.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={rsvp.profiles.avatar_url || ""} />
                                <AvatarFallback>
                                  {rsvp.profiles.full_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                            <div>
                              <p className="font-medium">{rsvp.full_name || rsvp.profiles.full_name}</p>
                              {rsvp.email_address && (
                                <p className="text-xs text-muted-foreground">{rsvp.email_address}</p>
                              )}
                              {rsvp.phone_number && (
                                <p className="text-xs text-muted-foreground">{rsvp.phone_number}</p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {formatTimeAgo(rsvp.created_at)}
                              </p>
                            </div>
                            </div>
                            <Badge 
                              variant={
                                rsvp.status === 'going' ? 'default' : 
                                rsvp.status === 'interested' ? 'secondary' : 'outline'
                              }
                            >
                              {rsvp.status === 'going' ? 'Going' : 
                               rsvp.status === 'interested' ? 'Interested' : 'Not Going'}
                            </Badge>
                          </div>
                          {rsvp.message && (
                            <p className="text-sm text-muted-foreground mt-2 ml-13">
                              "{rsvp.message}"
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">RSVP is not enabled for this event</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {event.rsvp_enabled && (
          <RSVPDialog
            open={showRsvpDialog}
            onOpenChange={setShowRsvpDialog}
            eventId={event.id}
            eventTitle={event.title}
            onRSVPSubmitted={handleRsvpSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewEventDialog;