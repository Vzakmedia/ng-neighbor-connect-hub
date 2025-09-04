import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Plus, X, Navigation, Upload, FileIcon, ImageIcon, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import LocationPickerDialog from '@/components/LocationPickerDialog';
import '@/types/supabase-complete-override.d.ts';

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
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [rsvpEnabled, setRsvpEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
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

  const handleLocationConfirm = (confirmedLocation: string, coords: { lat: number; lng: number }) => {
    setLocation(confirmedLocation);
  };

  const openLocationPicker = () => {
    setShowLocationPicker(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('event-files')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('event-files')
        .getPublicUrl(fileName);

      return {
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type
      };
    });

    try {
      const uploadedFilesData = await Promise.all(uploadPromises);
      setUploadedFiles([...uploadedFiles, ...uploadedFilesData]);
      toast({
        title: "Files uploaded successfully",
        description: `${uploadedFilesData.length} files uploaded`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setLocation('');
    setTags([]);
    setCurrentTag('');
    setRsvpEnabled(false);
    setUploadedFiles([]);
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
        .from('events')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          location: location.trim() || null,
          tags: tags,
          image_urls: uploadedFiles.filter(f => f.type.startsWith('image/')).map(f => f.url),
          file_urls: uploadedFiles,
          rsvp_enabled: rsvpEnabled,
          event_date: new Date().toISOString(), // TODO: Add date picker
          is_public: true
        } as any);

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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openLocationPicker}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              Use my location
            </Button>
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

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>Attach Files & Media</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer space-y-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  {uploading ? "Uploading..." : "Click to upload images, videos, or documents"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Max file size: 10MB per file
                </p>
              </label>
            </div>

            {/* Display uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded Files:</p>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileIcon className="h-4 w-4" />
                      )}
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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