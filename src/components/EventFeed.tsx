import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  MapPin,
  Clock,
  Calendar,
  Search,
  Bookmark,
  Users,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import CommentSection from '@/components/CommentSection';
import ShareDialog from '@/components/ShareDialog';
import RSVPDialog from '@/components/RSVPDialog';
import ViewEventDialog from '@/components/ViewEventDialog';

interface DatabasePost {
  id: string;
  user_id: string;
  post_type: string;
  title: string | null;
  content: string;
  location: string | null;
  image_urls: string[];
  tags: string[];
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

interface Event {
  id: string;
  author: {
    name: string;
    avatar?: string;
    location: string;
  };
  content: string;
  title: string;
  timestamp: string;
  likes: number;
  comments: number;
  images?: string[];
  tags: string[];
  isLiked: boolean;
  isSaved: boolean;
  rsvp_enabled: boolean;
  // Additional properties for ViewEventDialog compatibility
  location: string;
  created_at: string;
  user_id: string;
  file_urls?: any[];
  image_urls?: string[];
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

const EventFeed = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [viewEventDialogOpen, setViewEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('community_posts')
        .select(`
          id,
          user_id,
          post_type,
          title,
          content,
          location,
          image_urls,
          tags,
          created_at,
          rsvp_enabled
        `)
        .eq('post_type', 'event')
        .order('created_at', { ascending: false });

      const { data: postsData, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
        return;
      }

      if (!postsData) return;

      // Get user profiles
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, neighborhood, city, state')
        .in('user_id', userIds);

      const profilesMap = profilesData?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      // Get likes and comments counts
      const eventIds = postsData.map(post => post.id);
      
      const [likesResult, commentsResult, userLikesResult, userSavesResult] = await Promise.all([
        supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', eventIds),
        supabase
          .from('post_comments')
          .select('post_id')
          .in('post_id', eventIds),
        user ? supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', eventIds)
          .eq('user_id', user.id) : { data: [] },
        user ? supabase
          .from('saved_posts')
          .select('post_id')
          .in('post_id', eventIds)
          .eq('user_id', user.id) : { data: [] }
      ]);

      const likeCounts = likesResult.data?.reduce((acc, like) => {
        acc[like.post_id] = (acc[like.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const commentCounts = commentsResult.data?.reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const userLikes = new Set(userLikesResult.data?.map(like => like.post_id) || []);
      const userSaves = new Set(userSavesResult.data?.map(save => save.post_id) || []);

      const transformedEvents: Event[] = postsData.map((post: any) => {
        const profile = profilesMap[post.user_id];
        return {
          id: post.id,
          author: {
            name: profile?.full_name || 'Anonymous User',
            avatar: profile?.avatar_url || undefined,
            location: [
              profile?.neighborhood,
              profile?.city,
              profile?.state
            ].filter(Boolean).join(', ') || 'Unknown Location'
          },
          content: post.content,
          title: post.title || 'Untitled Event',
          timestamp: post.created_at,
          likes: likeCounts[post.id] || 0,
          comments: commentCounts[post.id] || 0,
          images: post.image_urls || [],
          tags: post.tags || [],
          isLiked: userLikes.has(post.id),
          isSaved: userSaves.has(post.id),
          rsvp_enabled: post.rsvp_enabled || false,
          // Additional properties for ViewEventDialog
          location: post.location || '',
          created_at: post.created_at,
          user_id: post.user_id,
          file_urls: post.file_urls || [],
          image_urls: post.image_urls || [],
          profiles: {
            full_name: profile?.full_name || 'Anonymous User',
            avatar_url: profile?.avatar_url || ''
          }
        };
      });

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handleLike = async (eventId: string) => {
    if (!user) return;

    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      if (event.isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', eventId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: eventId, user_id: user.id });
      }

      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { 
              ...e, 
              isLiked: !e.isLiked,
              likes: e.isLiked ? e.likes - 1 : e.likes + 1
            }
          : e
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (eventId: string) => {
    if (!user) return;

    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      if (event.isSaved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', eventId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('saved_posts')
          .insert({ post_id: eventId, user_id: user.id });
      }

      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { ...e, isSaved: !e.isSaved }
          : e
      ));

      toast({
        title: event.isSaved ? "Event unsaved" : "Event saved",
        description: event.isSaved ? "Event removed from saved items" : "Event saved for later"
      });
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
    }
  };

  const toggleComments = (eventId: string) => {
    setOpenComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleShare = (event: Event) => {
    setSelectedEvent(event);
    setShareDialogOpen(true);
  };

  const handleRSVP = (event: Event) => {
    setSelectedEvent(event);
    setRsvpDialogOpen(true);
  };

  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true;
    
    return event.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           event.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           event.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar - Mobile optimized */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 min-h-[44px] touch-manipulation"
        />
      </div>

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No events found matching your search' : 'No events posted yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow touch-manipulation">
            <CardHeader className="pb-3 p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                    <AvatarImage src={event.author.avatar} />
                    <AvatarFallback className="text-xs">{event.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm md:text-base truncate">{event.author.name}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs text-muted-foreground gap-1 sm:gap-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{event.author.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{formatTimeAgo(event.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Event
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 touch-manipulation">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 p-4 md:p-6">
              {event.title && (
                <h3 className="text-base md:text-lg font-semibold mb-2 line-clamp-2">{event.title}</h3>
              )}
              
              <p className="text-foreground mb-3 whitespace-pre-wrap text-sm md:text-base line-clamp-3">{event.content}</p>
              
              {event.images && event.images.length > 0 && (
                <div className={`grid gap-2 mb-3 ${
                  event.images.length === 1 ? 'grid-cols-1' : 
                  event.images.length === 2 ? 'grid-cols-2' : 
                  'grid-cols-2'
                }`}>
                  {event.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt="Event image"
                      className="rounded-lg object-cover w-full h-24 md:h-32 touch-manipulation"
                    />
                  ))}
                  {event.images.length > 4 && (
                    <div className="rounded-lg bg-muted flex items-center justify-center h-24 md:h-32 text-sm text-muted-foreground">
                      +{event.images.length - 4} more
                    </div>
                  )}
                </div>
              )}

              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {event.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {event.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{event.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t gap-3">
                <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(event.id)}
                    className={`text-xs min-h-[44px] px-3 touch-manipulation ${event.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${event.isLiked ? 'fill-current' : ''}`} />
                    {event.likes}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleComments(event.id)}
                    className="text-xs text-muted-foreground min-h-[44px] px-3 touch-manipulation"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {event.comments}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(event)}
                    className="text-xs text-muted-foreground min-h-[44px] px-3 touch-manipulation"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSave(event.id)}
                    className={`text-xs min-h-[44px] px-3 touch-manipulation ${event.isSaved ? 'text-blue-500' : 'text-muted-foreground'}`}
                  >
                    <Bookmark className={`h-4 w-4 mr-1 ${event.isSaved ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{event.isSaved ? 'Saved' : 'Save'}</span>
                  </Button>
                </div>
                
                <div className="flex items-center justify-center sm:justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(event);
                      setViewEventDialogOpen(true);
                    }}
                    className="min-h-[44px] px-3 text-xs touch-manipulation flex-1 sm:flex-none"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Event
                  </Button>
                  
                  {event.rsvp_enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRSVP(event)}
                      className="min-h-[44px] px-3 text-xs touch-manipulation flex-1 sm:flex-none"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      RSVP
                    </Button>
                  )}
                </div>
              </div>

              {openComments.has(event.id) && (
                <div className="mt-4 pt-4 border-t">
                  <CommentSection 
                    postId={event.id} 
                    commentCount={event.comments}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {selectedEvent && (
        <>
          <ShareDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            postId={selectedEvent.id}
            postTitle={selectedEvent.title || ''}
            postContent={selectedEvent.content}
            postAuthor={selectedEvent.author.name}
          />
          
          <RSVPDialog
            open={rsvpDialogOpen}
            onOpenChange={setRsvpDialogOpen}
            eventId={selectedEvent.id}
            eventTitle={selectedEvent.title || 'Community Event'}
            onRSVPSubmitted={() => fetchEvents()}
          />
          
          <ViewEventDialog
            open={viewEventDialogOpen}
            onOpenChange={setViewEventDialogOpen}
            event={selectedEvent}
          />
        </>
      )}
    </div>
  );
};

export default EventFeed;