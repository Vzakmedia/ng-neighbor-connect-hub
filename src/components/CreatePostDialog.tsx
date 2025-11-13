import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import OnlineAvatar from '@/components/OnlineAvatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertTriangle,
  ShoppingCart,
  Users,
  Calendar,
  MapPin,
  ImagePlus,
  X,
  Navigation,
  Building,
  Home,
  Globe
} from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNativeCamera } from '@/hooks/mobile/useNativeCamera';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from '@/lib/icons';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePostDialog = ({ open, onOpenChange }: CreatePostDialogProps) => {
  const [postType, setPostType] = useState<string>('general');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpEnabled, setRsvpEnabled] = useState(false);
  const [locationScope, setLocationScope] = useState<'neighborhood' | 'city' | 'state' | 'all'>('all');
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { pickImages, isNative } = useNativeCamera();

  const postTypes = [
    { value: 'general', label: 'General Update', icon: Users, color: 'text-muted-foreground' },
    { value: 'safety', label: 'Safety Alert', icon: AlertTriangle, color: 'text-destructive' },
    { value: 'marketplace', label: 'Marketplace Item', icon: ShoppingCart, color: 'text-community-green' },
    { value: 'help', label: 'Need Help', icon: Users, color: 'text-community-blue' },
    { value: 'event', label: 'Community Event', icon: Calendar, color: 'text-community-yellow' },
  ];

  const getCurrentPostType = () => postTypes.find(type => type.value === postType)!;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles].slice(0, 4)); // Max 4 images
    }
  };

  const handleNativeImagePick = async () => {
    if (!isNative) return;
    
    const files = await pickImages(true);
    if (files.length > 0) {
      setImages(prev => [...prev, ...files].slice(0, 4)); // Max 4 images
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Check if user has required location data for selected visibility scope
  const hasRequiredLocation = () => {
    if (locationScope === 'all') return true;
    if (locationScope === 'state') return !!profile?.state;
    if (locationScope === 'city') return !!profile?.state && !!profile?.city;
    if (locationScope === 'neighborhood') {
      return !!profile?.state && !!profile?.city && !!profile?.neighborhood;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    // Show optimistic success immediately
    toast({
      title: "Creating post...",
      description: "Your post is being shared with the community.",
    });

    // Reset form and close dialog immediately
    const formState = { content, title, images, tags, currentTag, postType, rsvpEnabled, locationScope };
    setContent('');
    setTitle('');
    setImages([]);
    setTags([]);
    setCurrentTag('');
    setPostType('general');
    setRsvpEnabled(false);
    setLocationScope('all');
    onOpenChange(false);

    setIsSubmitting(true);
    try {
      // Upload images first if any
      const imageUrls: string[] = [];
      if (formState.images.length > 0) {
        for (const image of formState.images) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, image);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            imageUrls.push(publicUrl);
          }
        }
      }

      // Use exact profile location as single source of truth
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          post_type: formState.postType,
          title: formState.title || null,
          content: formState.content,
          location: profile?.neighborhood && profile?.city && profile?.state
            ? `${profile.neighborhood}, ${profile.city}, ${profile.state}`
            : null,
          image_urls: imageUrls,
          tags: formState.tags,
          rsvp_enabled: formState.postType === 'event' ? formState.rsvpEnabled : false,
          location_scope: formState.locationScope,
          target_neighborhood: formState.locationScope === 'neighborhood' ? profile?.neighborhood : null,
          target_city: formState.locationScope === 'city' || formState.locationScope === 'neighborhood' ? profile?.city : null,
          target_state: formState.locationScope === 'state' || formState.locationScope === 'city' || formState.locationScope === 'neighborhood' ? profile?.state : null
        });

      if (error) throw error;
      
      toast({
        title: "Post created successfully!",
        description: "Your post has been shared with the community.",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "Please try again later.",
        variant: "destructive",
      });
      // Restore form on error
      setContent(formState.content);
      setTitle(formState.title);
      setImages(formState.images);
      setTags(formState.tags);
      setCurrentTag(formState.currentTag);
      setPostType(formState.postType);
      setRsvpEnabled(formState.rsvpEnabled);
      setLocationScope(formState.locationScope);
      onOpenChange(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 h-[60vh] pr-4 overflow-y-auto">{" "}
          <form onSubmit={handleSubmit} className="space-y-6 pb-4">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <OnlineAvatar
                userId={user?.id}
                src={profile?.avatar_url || undefined}
                fallback={profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                size="md"
              />
              <div>
                <p className="font-medium">{profile?.full_name || "Anonymous"}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.neighborhood || profile?.city || "Your neighborhood"}
                </p>
              </div>
            </div>

            {/* Post Type */}
            <div className="space-y-2">
              <Label>Post Type</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {postTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className={`h-4 w-4 ${type.color}`} />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Title (for certain post types) */}
            {['marketplace', 'event', 'safety'].includes(postType) && (
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your post..."
                  required
                />
              </div>
            )}

            {/* Content */}
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening in your neighborhood?"
                rows={4}
                required
                className="resize-none"
              />
            </div>

            {/* Post Visibility */}
            <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Label>Who can see this post?</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Your post will be visible to users based on your profile location and the scope you select below.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {!hasRequiredLocation() && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-xs text-destructive">
                    ⚠️ Your profile doesn't have complete location information for this visibility scope. 
                    Please update your profile with your complete location (State, LGA, and Ward).
                  </p>
                </div>
              )}

              <RadioGroup value={locationScope} onValueChange={(value: 'neighborhood' | 'city' | 'state' | 'all') => setLocationScope(value)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="neighborhood" id="neighborhood" />
                    <Label htmlFor="neighborhood" className="flex items-center gap-2 flex-1">
                      <Users className="h-4 w-4" />
                      <div className="flex-1">
                        <div>My Ward Only</div>
                        <div className="text-xs text-muted-foreground">
                          {profile?.neighborhood ? `${profile.neighborhood}, ${profile.city}` : 'Update your profile location'}
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="city" id="city" />
                    <Label htmlFor="city" className="flex items-center gap-2 flex-1">
                      <Building className="h-4 w-4" />
                      <div className="flex-1">
                        <div>My LGA</div>
                        <div className="text-xs text-muted-foreground">
                          {profile?.city || 'Update your profile location'}
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="state" id="state" />
                    <Label htmlFor="state" className="flex items-center gap-2 flex-1">
                      <Home className="h-4 w-4" />
                      <div className="flex-1">
                        <div>My State</div>
                        <div className="text-xs text-muted-foreground">
                          {profile?.state || 'Update your profile location'}
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="flex items-center gap-2 flex-1">
                      <Globe className="h-4 w-4" />
                      <div className="flex-1">
                        <div>Everyone</div>
                        <div className="text-xs text-muted-foreground">
                          Visible to all users on the platform
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>


            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (Optional)</Label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyPress}
                    placeholder="Add tags (press Enter or comma to add)..."
                    disabled={tags.length >= 5}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addTag}
                    disabled={!currentTag.trim() || tags.length >= 5}
                  >
                    Add
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0 text-xs"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                <span className="text-xs text-muted-foreground">
                  {tags.length}/5 tags
                </span>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Images (Optional)</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {isNative ? (
                    <Button type="button" variant="outline" onClick={handleNativeImagePick}>
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Add Images
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" className="relative">
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Add Images
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Up to 4 images
                  </span>
                </div>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RSVP Settings for Events */}
            {postType === 'event' && (
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
            )}

            {/* Post Type Preview */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Posting as:</span>
                <Badge variant="outline" className="text-xs">
                  {(() => {
                    const currentType = getCurrentPostType();
                    const Icon = currentType.icon;
                    return (
                      <>
                        <Icon className={`h-3 w-3 mr-1 ${currentType.color}`} />
                        {currentType.label}
                      </>
                    );
                  })()}
                </Badge>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting || !hasRequiredLocation()}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isSubmitting ? 'Posting...' : 'Post to Community'}
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
};

export default CreatePostDialog;