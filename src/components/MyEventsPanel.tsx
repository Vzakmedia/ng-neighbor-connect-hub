import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Users, Edit, Eye, Clock } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import EditEventDialog from '@/components/EditEventDialog';

interface Event {
  id: string;
  title: string;
  content: string;
  location: string;
  tags: string[];
  created_at: string;
  rsvp_enabled: boolean;
  rsvp_count: number;
  interested_count: number;
  not_going_count: number;
}

interface RSVP {
  id: string;
  user_id: string;
  status: 'going' | 'interested' | 'not_going';
  message?: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const MyEventsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventRsvps, setSelectedEventRsvps] = useState<RSVP[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  const fetchMyEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          title,
          content,
          location,
          tags,
          created_at,
          rsvp_enabled
        `)
        .eq('user_id', user.id)
        .eq('post_type', 'event')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch RSVP counts for each event
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          const { data: rsvpData } = await supabase
            .from('event_rsvps')
            .select('status')
            .eq('event_id', event.id);

          const goingCount = rsvpData?.filter(r => r.status === 'going').length || 0;
          const interestedCount = rsvpData?.filter(r => r.status === 'interested').length || 0;
          const notGoingCount = rsvpData?.filter(r => r.status === 'not_going').length || 0;

          return {
            ...event,
            rsvp_count: goingCount,
            interested_count: interestedCount,
            not_going_count: notGoingCount
          };
        })
      );

      setEvents(eventsWithCounts);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load your events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventRsvps = async (eventId: string) => {
    try {
      // First get RSVPs
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('id, user_id, status, message, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (rsvpError) throw rsvpError;

      // Then get profile data for each user
      const rsvpsWithProfiles = await Promise.all(
        (rsvpData || []).map(async (rsvp) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', rsvp.user_id)
            .single();

          return {
            ...rsvp,
            profiles: profileData || { full_name: 'Anonymous', avatar_url: '' }
          } as RSVP;
        })
      );

      setSelectedEventRsvps(rsvpsWithProfiles);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
      toast({
        title: "Error",
        description: "Failed to load RSVPs",
        variant: "destructive",
      });
    }
  };

  const handleViewRsvps = (eventId: string) => {
    setSelectedEventId(eventId);
    fetchEventRsvps(eventId);
  };

  const toggleRsvpEnabled = async (eventId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ rsvp_enabled: !currentState })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `RSVP ${!currentState ? 'enabled' : 'disabled'} for event`,
      });

      fetchMyEvents();
    } catch (error) {
      console.error('Error updating RSVP setting:', error);
      toast({
        title: "Error",
        description: "Failed to update RSVP setting",
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setEditDialogOpen(true);
  };

  const handleEventUpdated = () => {
    fetchMyEvents();
    // If we're viewing RSVPs for the updated event, refresh them too
    if (selectedEventId === eventToEdit?.id) {
      fetchEventRsvps(selectedEventId);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-8">
        <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Events Created</h3>
        <p className="text-muted-foreground">
          You haven't created any events yet. Create your first event to get started!
        </p>
      </div>
    );
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Events</h2>
        <Badge variant="secondary">{events.length} Events</Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTimeAgo(event.created_at)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRsvps(event.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View RSVPs
                    </Button>
                    <Button
                      variant={event.rsvp_enabled ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleRsvpEnabled(event.id, event.rsvp_enabled)}
                    >
                      {event.rsvp_enabled ? 'Disable RSVP' : 'Enable RSVP'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{event.content}</p>
                
                {event.rsvp_enabled && (
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Badge variant="default">{event.rsvp_count}</Badge>
                      <span>Going</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">{event.interested_count}</Badge>
                      <span>Interested</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">{event.not_going_count}</Badge>
                      <span>Not Going</span>
                    </div>
                  </div>
                )}

                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {event.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rsvps" className="space-y-4">
          {selectedEvent ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                RSVPs for "{selectedEvent.title}"
              </h3>
              
              {selectedEventRsvps.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No RSVPs yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {selectedEventRsvps.map((rsvp) => (
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
                              <p className="font-medium">{rsvp.profiles.full_name}</p>
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
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select an event from the Overview tab to view its RSVPs
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <EditEventDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        event={eventToEdit}
        onEventUpdated={handleEventUpdated}
      />
    </div>
  );
};

export default MyEventsPanel;