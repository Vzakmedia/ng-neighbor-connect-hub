import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon, PlusIcon, XMarkIcon, MapIcon, ArrowUpTrayIcon, DocumentIcon, PhotoIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PlacesAutocomplete from '@/components/PlacesAutocomplete';
import { MediaUploader } from '@/components/MediaUploader';
import { useCloudinaryUpload, CloudinaryAttachment } from '@/hooks/useCloudinaryUpload';

interface Event {
  id: string;
  title: string;
  content: string;
  location: string;
  tags: string[];
  rsvp_enabled: boolean;
  file_urls?: any[];
}

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onEventUpdated?: () => void;
}

const EditEventDialog = ({ open, onOpenChange, event, onEventUpdated }: EditEventDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [rsvpEnabled, setRsvpEnabled] = useState(false);
  const [media, setMedia] = useState<File[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<CloudinaryAttachment[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadMultipleFiles, uploading, progress } = useCloudinaryUpload(user?.id || '', 'events');

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setContent(event.content || '');
      setLocation(event.location || '');
      setTags(event.tags || []);
      setRsvpEnabled(event.rsvp_enabled || false);
      // Convert existing file URLs to CloudinaryAttachment format for display
      const existingFiles = (event.file_urls || []).map((file: any) => ({
        id: file.url,
        type: file.type?.startsWith('video/') ? 'video' : 'image',
        name: file.name || 'file',
        url: file.url,
        size: file.size || 0,
        mimeType: file.type || 'application/octet-stream'
      } as CloudinaryAttachment));
      setUploadedMedia(existingFiles);
    }
  }, [event]);

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

  const handleLocationConfirm = (confirmedLocation: string, coords: { lat: number; lng: number }) => {
    setLocation(confirmedLocation);
    setCoordinates(coords);
  };

  const handleMediaSelect = (files: File[]) => {
    setMedia([...media, ...files].slice(0, 5));
  };

  const handleMediaRemove = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setLocation('');
    setTags([]);
    setCurrentTag('');
    setRsvpEnabled(false);
    setMedia([]);
    setUploadedMedia([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !event) {
      toast({
        title: "Error",
        description: "Unable to update event",
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
      // Upload new media if any
      let attachments: CloudinaryAttachment[] = [...uploadedMedia];
      if (media.length > 0) {
        const newAttachments = await uploadMultipleFiles(media);
        attachments = [...attachments, ...newAttachments];
      }
      
      // Separate images and videos
      const imageUrls = attachments.filter(a => a.type === 'image').map(a => a.url);
      const videoAttachment = attachments.find(a => a.type === 'video');

      const { error } = await supabase
        .from('community_posts')
        .update({
          title: title.trim(),
          content: content.trim(),
          location: location.trim() || null,
          tags: tags,
          rsvp_enabled: rsvpEnabled,
          image_urls: imageUrls,
          video_url: videoAttachment?.url || null,
          video_thumbnail_url: videoAttachment?.thumbnailUrl || null,
          file_urls: attachments.map(a => ({
            name: a.name,
            url: a.url,
            size: a.size,
            type: a.mimeType
          })),
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Your event has been updated successfully",
      });

      onOpenChange(false);
      onEventUpdated?.();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
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
            <CalendarIcon className="h-5 w-5" />
            Edit Event
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
            <PlacesAutocomplete
              onLocationSelect={handleLocationConfirm}
              placeholder="Search for event location in Nigeria..."
              defaultValue={location}
            />
            {location && coordinates && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPinIcon className="h-3 w-3" />
                <span>{location}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLocation('');
                    setCoordinates(null);
                  }}
                >
                  Clear
                </Button>
              </div>
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
                <PlusIcon className="h-4 w-4" />
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
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>Attach Files & Media</Label>
            <MediaUploader
              onFilesSelected={handleMediaSelect}
              accept="both"
              maxFiles={5}
              uploadedFiles={uploadedMedia}
              onRemove={handleMediaRemove}
              uploading={uploading}
              progress={progress}
            />
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
              {loading ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;