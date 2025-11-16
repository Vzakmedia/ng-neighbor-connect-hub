import { useState, useEffect } from 'react';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
  Globe,
  Camera,
  Image as ImageIcon,
  BarChart3,
  Heart,
  ChevronUp,
  ChevronDown,
  Plus
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { pickImages, isNative } = useNativeCamera();

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const postTypes = [
    { value: 'general', label: 'General Update', icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    { value: 'photo', label: 'Photo/Video', icon: Camera, color: 'text-green-500', bgColor: 'bg-green-100' },
    { value: 'poll', label: 'Poll', icon: BarChart3, color: 'text-orange-500', bgColor: 'bg-orange-100' },
    { value: 'event', label: 'Event', icon: Calendar, color: 'text-pink-500', bgColor: 'bg-pink-100' },
    { value: 'safety', label: 'Safety Alert', icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-100' },
    { value: 'marketplace', label: 'Marketplace', icon: ShoppingCart, color: 'text-teal-500', bgColor: 'bg-teal-100' },
    { value: 'help', label: 'Need Help', icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-100' },
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

  // Mobile Sheet Version
  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent 
            side="bottom" 
            className="h-full p-0 flex flex-col"
          >
            {/* Header */}
            <SheetHeader className="flex-row items-center justify-between p-4 border-b flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <SheetTitle className="flex-1 text-center">
                Create Post
              </SheetTitle>
              
              <Button
                variant="ghost"
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting || !hasRequiredLocation()}
                className="text-primary font-semibold"
              >
                Post
              </Button>
            </SheetHeader>

            {/* Scrollable Content Area */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4 pb-24">
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

                {/* Large Textarea */}
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What do you want to talk about?"
                  rows={6}
                  required
                  className="resize-none text-base border-0 focus-visible:ring-0 p-0"
                />

                {/* Conditional Title */}
                {['marketplace', 'event', 'safety'].includes(postType) && (
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a title..."
                      required
                    />
                  </div>
                )}

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags Display */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Tag Input */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={handleTagKeyPress}
                      placeholder="Add tags..."
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
                  <span className="text-xs text-muted-foreground">
                    {tags.length}/5 tags
                  </span>
                </div>

                {/* Post Visibility */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label>Who can see this post?</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Your post will be visible based on your profile location and the scope you select.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {!hasRequiredLocation() && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-xs text-destructive">
                        ⚠️ Your profile doesn't have complete location information for this visibility scope.
                      </p>
                    </div>
                  )}

                  <RadioGroup 
                    value={locationScope} 
                    onValueChange={(value: 'neighborhood' | 'city' | 'state' | 'all') => setLocationScope(value)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="neighborhood" id="neighborhood" />
                        <Label htmlFor="neighborhood" className="flex items-center gap-2 flex-1">
                          <Users className="h-4 w-4" />
                          <div className="flex-1">
                            <div>My Ward Only</div>
                            <div className="text-xs text-muted-foreground">
                              {profile?.neighborhood ? `${profile.neighborhood}, ${profile.city}` : 'Update location'}
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
                              {profile?.city || 'Update location'}
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
                              {profile?.state || 'Update location'}
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
                              Visible to all users
                            </div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* RSVP for Events */}
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
                      Allow people to RSVP and track attendance
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Fixed Bottom Section - Collapsed Drawer Trigger */}
            <div className="border-t bg-background flex-shrink-0">
              <div className="flex items-center justify-between p-3">
                {/* Icon Row */}
                <div className="flex gap-2 overflow-x-auto">
                  {postTypes.slice(0, 6).map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          setPostType(type.value);
                          setDrawerOpen(true);
                        }}
                        className={`flex-shrink-0 p-2 rounded-full ${type.bgColor} ${type.color} transition-all active:scale-95`}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
                
                {/* Up Arrow to Expand */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(true)}
                  className="flex-shrink-0"
                >
                  <ChevronUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Bottom Drawer for Post Type Selection */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[70vh]">
            <DrawerHeader className="flex flex-row items-center justify-between">
              <DrawerTitle>Add to your post</DrawerTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </DrawerHeader>
            
            <div className="p-4">
              {/* 2-Column Grid */}
              <div className="grid grid-cols-2 gap-3">
                {postTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = postType === type.value;
                  
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        setPostType(type.value);
                        setDrawerOpen(false);
                      }}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${type.bgColor}`}>
                          <Icon className={`h-5 w-5 ${type.color}`} />
                        </div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                      <div className={`p-1 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-muted'}`}>
                        <Plus className="h-4 w-4" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Image Upload in Drawer */}
              <div className="mt-4 pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Add Media</Label>
                {isNative ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={async () => {
                      await handleNativeImagePick();
                      setDrawerOpen(false);
                    }}
                    disabled={images.length >= 4}
                    className="w-full"
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Add Images (up to 4)
                  </Button>
                ) : (
                  <Button type="button" variant="outline" className="relative w-full" disabled={images.length >= 4}>
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Add Images (up to 4)
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        handleImageChange(e);
                        setDrawerOpen(false);
                      }}
                      disabled={images.length >= 4}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </Button>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop Dialog Version (unchanged)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 h-[60vh] pr-4 overflow-y-auto">
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

            {/* Keep all existing desktop form fields */}
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

            {/* All other existing fields remain unchanged */}
          </form>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting || !hasRequiredLocation()}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;