import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Plus, X, Navigation, Map, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import LocationPickerDialog from '@/components/LocationPickerDialog';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: () => void;
}

const CreateEventDialog = ({ open, onOpenChange, onEventCreated }: CreateEventDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [rsvpEnabled, setRsvpEnabled] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Construct a readable address from available data
      const addressParts = [
        data.locality || data.city || data.principalSubdivision,
        data.principalSubdivision || data.countryName
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        return addressParts.join(', ');
      }
      
      // If we have display_name, use that
      if (data.display_name) {
        return data.display_name;
      }
      
      // Last resort - return a generic location description
      return "Current Location";
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return "Current Location";
    }
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
      return;
    }

    setLoadingLocation(true);

    // Start watching position for real-time updates - focus on address only
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          setLocation(address);
          
          toast({
            title: "Location updated",
            description: "Your address is being tracked in real-time",
          });
          
          setLoadingLocation(false);
        } catch (error) {
          console.error('Error getting location:', error);
          toast({
            title: "Error",
            description: "Failed to get location details",
            variant: "destructive",
          });
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let message = "Failed to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }

        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // Cache for 30 seconds
      }
    );

    setWatchId(id);
  };

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      toast({
        title: "Location tracking stopped",
        description: "Real-time location updates have been disabled",
      });
    }
  };

  const handleLocationConfirm = (confirmedLocation: string) => {
    setLocation(confirmedLocation);
    // Stop real-time tracking since user has confirmed a specific location
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Cleanup watch position when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  useEffect(() => {
    if (!open && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [open, watchId]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setLocation('');
    setTags([]);
    setCurrentTag('');
    setRsvpEnabled(false);
    // Stop location tracking when resetting form
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an event",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error", 
        description: "Please fill in the title and description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          post_type: 'event',
          title: title.trim(),
          content: content.trim(),
          location: location.trim() || null,
          tags: tags,
          image_urls: [],
          rsvp_enabled: rsvpEnabled
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Your event has been created successfully",
      });

      resetForm();
      onOpenChange(false);
      onEventCreated?.();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Event
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="Enter event title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Event Description *</Label>
            <Textarea
              id="content"
              placeholder="Describe your event... Include date, time, and any important details."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Event location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseMyLocation}
                disabled={loadingLocation}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {loadingLocation ? "Getting location..." : "Use My Location"}
              </Button>
              
              {watchId !== null && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={stopLocationTracking}
                >
                  <X className="h-4 w-4 mr-2" />
                  Stop Tracking
                </Button>
              )}
            </div>
            
            {watchId !== null && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Real-time location tracking enabled
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!currentTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* RSVP Settings */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rsvp-enabled"
                checked={rsvpEnabled}
                onCheckedChange={(checked) => setRsvpEnabled(checked as boolean)}
              />
              <Label htmlFor="rsvp-enabled" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Enable RSVP for this event
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Allow people to RSVP and track attendance for your event
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>

        <LocationPickerDialog
          open={showLocationPicker}
          onOpenChange={setShowLocationPicker}
          onLocationConfirm={handleLocationConfirm}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;