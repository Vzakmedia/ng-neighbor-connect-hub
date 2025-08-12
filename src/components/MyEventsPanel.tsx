import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, MapPin, Users, Edit, Eye, Clock, Download, Trash2 } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import EditEventDialog from '@/components/EditEventDialog';
import { PromotePostButton } from '@/components/PromotePostButton';

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

interface EventWithRSVPs extends Event {
  rsvps: RSVP[];
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

const MyEventsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsWithRsvps, setEventsWithRsvps] = useState<EventWithRSVPs[]>([]);
  const [selectedEventRsvps, setSelectedEventRsvps] = useState<RSVP[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

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
      // First get RSVPs with all the new fields
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('id, user_id, status, message, created_at, full_name, phone_number, email_address')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (rsvpError) throw rsvpError;

      // Then get profile data for each user
      const rsvpsWithProfiles = await Promise.all(
        (rsvpData || []).map(async (rsvp) => {
          const { data: profileData } = await supabase
            .from('public_profiles')
            .select('display_name, avatar_url')
            .eq('user_id', rsvp.user_id)
            .single();

          return {
            ...rsvp,
            profiles: { full_name: profileData?.display_name || 'Anonymous', avatar_url: profileData?.avatar_url || '' }
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

  const fetchAllEventsWithRsvps = async () => {
    if (!user) return;

    try {
      const eventsWithRsvps: EventWithRSVPs[] = await Promise.all(
        events.map(async (event) => {
          // First get RSVPs with all the new fields
          const { data: rsvpData, error: rsvpError } = await supabase
            .from('event_rsvps')
            .select('id, user_id, status, message, created_at, full_name, phone_number, email_address')
            .eq('event_id', event.id)
            .order('created_at', { ascending: false });

          if (rsvpError) throw rsvpError;

          // Then get profile data for each user
          const rsvpsWithProfiles = await Promise.all(
            (rsvpData || []).map(async (rsvp) => {
              const { data: profileData } = await supabase
                .from('public_profiles')
                .select('display_name, avatar_url')
                .eq('user_id', rsvp.user_id)
                .single();

              return {
                ...rsvp,
                profiles: { full_name: profileData?.display_name || 'Anonymous', avatar_url: profileData?.avatar_url || '' }
              } as RSVP;
            })
          );

          return {
            ...event,
            rsvps: rsvpsWithProfiles
          };
        })
      );

      setEventsWithRsvps(eventsWithRsvps);
    } catch (error) {
      console.error('Error fetching events with RSVPs:', error);
      toast({
        title: "Error",
        description: "Failed to load events with RSVPs",
        variant: "destructive",
      });
    }
  };

  const handleViewRsvps = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('rsvps'); // Switch to RSVPs tab
    fetchAllEventsWithRsvps(); // Load all events with RSVPs
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

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted",
      });

      fetchMyEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete the event",
        variant: "destructive",
      });
    }
  };

  const exportRSVPs = async (eventId: string, eventTitle: string) => {
    try {
      const { data: rsvpData, error } = await supabase
        .from('event_rsvps')
        .select('status, message, created_at, full_name, phone_number, email_address')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!rsvpData || rsvpData.length === 0) {
        toast({
          title: "No RSVPs to export",
          description: "This event has no RSVPs yet",
          variant: "destructive",
        });
        return;
      }

      // Convert to CSV format
      const headers = ['Full Name', 'Email Address', 'Phone Number', 'Status', 'Message', 'RSVP Date'];
      const csvContent = [
        headers.join(','),
        ...rsvpData.map(rsvp => [
          `"${rsvp.full_name || 'N/A'}"`,
          `"${rsvp.email_address || 'N/A'}"`,
          `"${rsvp.phone_number || 'N/A'}"`,
          `"${rsvp.status}"`,
          `"${rsvp.message || 'N/A'}"`,
          `"${new Date(rsvp.created_at).toLocaleDateString()}"`
        ].join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_rsvps.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: "RSVP data has been downloaded as CSV",
      });

    } catch (error) {
      console.error('Error exporting RSVPs:', error);
      toast({
        title: "Export failed",
        description: "Failed to export RSVP data",
        variant: "destructive",
      });
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
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold">My Events</h2>
        <Badge variant="secondary" className="self-start sm:self-center">
          {events.length} Event{events.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="overview" className="touch-manipulation text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rsvps" className="touch-manipulation text-sm">
            <Users className="h-4 w-4 mr-2" />
            RSVPs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="touch-manipulation">
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base md:text-lg line-clamp-2">{event.title}</CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                        <span>{formatTimeAgo(event.created_at)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile action buttons */}
                  <div className="lg:hidden flex flex-col gap-2 w-full">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                        className="flex-1 min-h-[44px] touch-manipulation text-xs"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRsvps(event.id)}
                        className="flex-1 min-h-[44px] touch-manipulation text-xs"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        RSVPs
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <PromotePostButton
                        postId={event.id}
                        postType="event"
                        postTitle={event.title}
                        postDescription={event.content}
                        className="flex-1 min-h-[44px] touch-manipulation text-xs"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      {event.rsvp_enabled && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportRSVPs(event.id, event.title)}
                          className="flex-1 min-h-[44px] touch-manipulation text-xs"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      )}
                      <Button
                        variant={event.rsvp_enabled ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleRsvpEnabled(event.id, event.rsvp_enabled)}
                        className="flex-1 min-h-[44px] touch-manipulation text-xs"
                      >
                        {event.rsvp_enabled ? 'Disable RSVP' : 'Enable RSVP'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id, event.title)}
                        className="min-h-[44px] touch-manipulation text-xs px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Desktop action buttons */}
                  <div className="hidden lg:flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                      className="touch-manipulation"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRsvps(event.id)}
                      className="touch-manipulation"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View RSVPs
                    </Button>
                    <PromotePostButton
                      postId={event.id}
                      postType="event"
                      postTitle={event.title}
                      postDescription={event.content}
                      className="touch-manipulation"
                    />
                    {event.rsvp_enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportRSVPs(event.id, event.title)}
                        className="touch-manipulation"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export RSVPs
                      </Button>
                    )}
                    <Button
                      variant={event.rsvp_enabled ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleRsvpEnabled(event.id, event.rsvp_enabled)}
                      className="touch-manipulation"
                    >
                      {event.rsvp_enabled ? 'Disable RSVP' : 'Enable RSVP'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id, event.title)}
                      className="touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm md:text-base text-muted-foreground mb-4 line-clamp-3">{event.content}</p>
                
                {event.rsvp_enabled && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Badge variant="default" className="text-xs">{event.rsvp_count}</Badge>
                      <span>Going</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">{event.interested_count}</Badge>
                      <span>Interested</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">{event.not_going_count}</Badge>
                      <span>Not Going</span>
                    </div>
                  </div>
                )}

                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {event.tags.slice(0, 5).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {event.tags.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{event.tags.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rsvps" className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                All Event RSVPs
              </h3>
            </div>
            
            {eventsWithRsvps.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Click "View RSVPs" on any event to load RSVP data</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {eventsWithRsvps.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.rsvps.length} {event.rsvps.length === 1 ? 'RSVP' : 'RSVPs'}
                          </p>
                        </div>
                        {event.rsvp_enabled && event.rsvps.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportRSVPs(event.id, event.title)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export RSVPs
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {event.rsvps.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8 px-6">No RSVPs for this event yet</p>
                      ) : (
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>RSVP Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {event.rsvps.map((rsvp) => (
                                <TableRow key={rsvp.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={rsvp.profiles.avatar_url || ""} />
                                        <AvatarFallback>
                                          {(rsvp.full_name || rsvp.profiles.full_name)?.charAt(0) || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">
                                        {rsvp.full_name || rsvp.profiles.full_name}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      {rsvp.email_address && (
                                        <div className="text-xs text-muted-foreground">
                                          {rsvp.email_address}
                                        </div>
                                      )}
                                      {rsvp.phone_number && (
                                        <div className="text-xs text-muted-foreground">
                                          {rsvp.phone_number}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        rsvp.status === 'going' ? 'default' : 
                                        rsvp.status === 'interested' ? 'secondary' : 'outline'
                                      }
                                    >
                                      {rsvp.status === 'going' ? 'Going' : 
                                       rsvp.status === 'interested' ? 'Interested' : 'Not Going'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">
                                      {rsvp.message || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                      {formatTimeAgo(rsvp.created_at)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
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