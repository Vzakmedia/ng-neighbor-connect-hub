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
import { MediaUploader } from '@/components/MediaUploader';
import { useCloudinaryUpload, CloudinaryAttachment } from '@/hooks/useCloudinaryUpload';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePostDialog = ({ open, onOpenChange }: CreatePostDialogProps) => {
  const [postType, setPostType] = useState<string>('general');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<CloudinaryAttachment[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpEnabled, setRsvpEnabled] = useState(false);
  const [locationScope, setLocationScope] = useState<'neighborhood' | 'city' | 'state' | 'all'>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Poll-specific state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState<string>('7');
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);
  const [maxChoices, setMaxChoices] = useState(1);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { pickImages, isNative } = useNativeCamera();
  const { uploadMultipleFiles, uploading, progress } = useCloudinaryUpload(user?.id || '', 'posts');

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

  const handleMediaSelect = async (files: File[]) => {
    // Allow max 4 items total, but only 1 video
    const hasVideo = uploadedMedia.some(f => f.type === 'video');
    const newHasVideo = files.some(f => f.type.startsWith('video/'));
    
    if (hasVideo || newHasVideo) {
      // If there's already a video or selecting a video, limit to 1 total item
      const attachments = await uploadMultipleFiles(files.slice(0, 1));
      setUploadedMedia(attachments);
    } else {
      // Otherwise allow up to 4 images
      const maxToAdd = 4 - uploadedMedia.length;
      const attachments = await uploadMultipleFiles(files.slice(0, maxToAdd));
      setUploadedMedia(prev => [...prev, ...attachments]);
    }
  };

  const handleMediaRemove = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
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

    // Poll validation
    if (postType === 'poll') {
      if (!pollQuestion.trim()) {
        toast({
          title: "Poll question required",
          description: "Please enter a question for your poll.",
          variant: "destructive",
        });
        return;
      }
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        toast({
          title: "At least 2 options required",
          description: "Please provide at least 2 poll options.",
          variant: "destructive",
        });
        return;
      }
    }

    // Show optimistic success immediately
    toast({
      title: "Creating post...",
      description: "Your post is being shared with the community.",
    });

    // Save uploaded media before resetting
    const savedUploadedMedia = [...uploadedMedia];
    
    // Reset form and close dialog immediately
    const formState = { 
      content, title, tags, currentTag, postType, rsvpEnabled, locationScope,
      pollQuestion, pollOptions, pollDuration, allowMultipleChoices, maxChoices
    };
    setContent('');
    setTitle('');
    setMedia([]);
    setUploadedMedia([]);
    setTags([]);
    setCurrentTag('');
    setPostType('general');
    setRsvpEnabled(false);
    setLocationScope('all');
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollDuration('7');
    setAllowMultipleChoices(false);
    setMaxChoices(1);
    onOpenChange(false);

    setIsSubmitting(true);
    try {
      // Separate images and videos from already-uploaded media
      const imageUrls = savedUploadedMedia.filter(a => a.type === 'image').map(a => a.url);
      const videoAttachment = savedUploadedMedia.find(a => a.type === 'video');

      // Use exact profile location as single source of truth
      const { data: postData, error } = await supabase
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
          video_url: videoAttachment?.url || null,
          video_thumbnail_url: videoAttachment?.thumbnailUrl || null,
          tags: formState.tags,
          rsvp_enabled: formState.postType === 'event' ? formState.rsvpEnabled : false,
          location_scope: formState.locationScope,
          target_neighborhood: formState.locationScope === 'neighborhood' ? profile?.neighborhood : null,
          target_city: formState.locationScope === 'city' || formState.locationScope === 'neighborhood' ? profile?.city : null,
          target_state: formState.locationScope === 'state' || formState.locationScope === 'city' || formState.locationScope === 'neighborhood' ? profile?.state : null
        })
        .select()
        .single();

      if (error) throw error;

      // If poll, create poll data
      if (formState.postType === 'poll' && postData) {
        const closesAt = new Date();
        closesAt.setDate(closesAt.getDate() + parseInt(formState.pollDuration));

        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .insert({
            post_id: postData.id,
            question: formState.pollQuestion,
            closes_at: closesAt.toISOString(),
            allow_multiple_choices: formState.allowMultipleChoices,
            max_choices: formState.allowMultipleChoices ? formState.maxChoices : 1,
          })
          .select()
          .single();

        if (pollError) throw pollError;

        // Insert poll options
        const validOptions = formState.pollOptions.filter(opt => opt.trim());
        const optionsToInsert = validOptions.map((option, index) => ({
          poll_id: pollData.id,
          option_text: option.trim(),
          option_order: index,
        }));

        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }
      
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
      setUploadedMedia(savedUploadedMedia); // Restore uploaded media
      setTags(formState.tags);
      setCurrentTag(formState.currentTag);
      setPostType(formState.postType);
      setRsvpEnabled(formState.rsvpEnabled);
      setLocationScope(formState.locationScope);
      setPollQuestion(formState.pollQuestion);
      setPollOptions(formState.pollOptions);
      setPollDuration(formState.pollDuration);
      setAllowMultipleChoices(formState.allowMultipleChoices);
      setMaxChoices(formState.maxChoices);
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
            hideClose
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

                {/* Media Uploader */}
                <MediaUploader
                  onFilesSelected={handleMediaSelect}
                  accept="both"
                  maxFiles={4}
                  uploadedFiles={uploadedMedia}
                  onRemove={handleMediaRemove}
                  uploading={uploading}
                  progress={progress}
                />

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

                {/* Poll Configuration */}
                {postType === 'poll' && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="space-y-2">
                      <Label>Poll Question *</Label>
                      <Input
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="What would you like to ask?"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Poll Options *</Label>
                      {pollOptions.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...pollOptions];
                              newOptions[index] = e.target.value;
                              setPollOptions(newOptions);
                            }}
                            placeholder={`Option ${index + 1}`}
                          />
                          {pollOptions.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPollOptions(pollOptions.filter((_, i) => i !== index));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 5 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPollOptions([...pollOptions, ''])}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {pollOptions.filter(o => o.trim()).length}/5 options (minimum 2 required)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Poll Duration</Label>
                      <Select value={pollDuration} onValueChange={setPollDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">1 week</SelectItem>
                          <SelectItem value="14">2 weeks</SelectItem>
                          <SelectItem value="30">1 month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="multiple-choices"
                          checked={allowMultipleChoices}
                          onCheckedChange={(checked) => {
                            setAllowMultipleChoices(checked as boolean);
                            if (!checked) setMaxChoices(1);
                          }}
                        />
                        <Label htmlFor="multiple-choices">
                          Allow multiple choices
                        </Label>
                      </div>

                      {allowMultipleChoices && (
                        <div className="ml-6 space-y-2">
                          <Label>Maximum choices</Label>
                          <Select 
                            value={maxChoices.toString()} 
                            onValueChange={(v) => setMaxChoices(parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[2, 3, 4, 5].map(num => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} options
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Fixed Bottom Section - Collapsed Drawer Trigger */}
            <div className="border-t bg-primary flex-shrink-0">
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
                        className="flex-shrink-0 p-2 rounded-lg bg-white/60 transition-all active:scale-95"
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </button>
                    );
                  })}
                </div>
                
                {/* Up Arrow to Expand */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(true)}
                  className="flex-shrink-0 text-white hover:bg-white/20"
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

              {/* Media Upload in Drawer */}
              <div className="mt-4 pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Add Media</Label>
                <MediaUploader
                  onFilesSelected={handleMediaSelect}
                  accept="both"
                  maxFiles={4}
                  uploadedFiles={uploadedMedia}
                  onRemove={handleMediaRemove}
                  uploading={uploading}
                  progress={progress}
                />
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

            {/* Media Upload & Preview */}
            <div className="space-y-2">
              <Label>Media (Images or Video)</Label>
              <MediaUploader
                onFilesSelected={handleMediaSelect}
                accept="both"
                maxFiles={4}
                uploadedFiles={uploadedMedia}
                onRemove={handleMediaRemove}
                uploading={uploading}
                progress={progress}
              />
            </div>

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
              <Label>Tags</Label>
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
                        Control who can see your post based on their location. Posts are only visible to users in the selected area.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {!hasRequiredLocation() && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Your profile location is incomplete. Please update your profile to use location-based visibility.
                  </p>
                </div>
              )}
              
              <RadioGroup value={locationScope} onValueChange={(value: any) => setLocationScope(value)}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="neighborhood" id="neighborhood" disabled={!profile?.neighborhood} />
                    <Label htmlFor="neighborhood" className={`flex items-center gap-2 ${!profile?.neighborhood ? 'opacity-50' : ''}`}>
                      <Home className="h-4 w-4" />
                      <div>
                        <div>My Ward Only</div>
                        <div className="text-xs text-muted-foreground">{profile?.neighborhood || 'Not set'}</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="city" id="city" disabled={!profile?.city} />
                    <Label htmlFor="city" className={`flex items-center gap-2 ${!profile?.city ? 'opacity-50' : ''}`}>
                      <Building className="h-4 w-4" />
                      <div>
                        <div>My LGA</div>
                        <div className="text-xs text-muted-foreground">{profile?.city || 'Not set'}</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="state" id="state" disabled={!profile?.state} />
                    <Label htmlFor="state" className={`flex items-center gap-2 ${!profile?.state ? 'opacity-50' : ''}`}>
                      <MapPin className="h-4 w-4" />
                      <div>
                        <div>My State</div>
                        <div className="text-xs text-muted-foreground">{profile?.state || 'Not set'}</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <div>
                        <div>Everyone</div>
                        <div className="text-xs text-muted-foreground">Visible to all users</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* RSVP Section for Events */}
            {postType === 'event' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rsvp"
                  checked={rsvpEnabled}
                  onCheckedChange={(checked) => setRsvpEnabled(checked as boolean)}
                />
                <Label htmlFor="rsvp" className="text-sm font-normal">
                  Enable RSVP for this event
                </Label>
              </div>
            )}

            {/* Poll Configuration Section */}
            {postType === 'poll' && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="pollQuestion">Poll Question *</Label>
                  <Input
                    id="pollQuestion"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="What's your question?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Poll Options</Label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        placeholder={`Option ${index + 1}`}
                        required={index < 2}
                      />
                      {index >= 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPollOptions(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPollOptions(prev => [...prev, ''])}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pollDuration">Poll Duration</Label>
                  <Select value={pollDuration} onValueChange={setPollDuration}>
                    <SelectTrigger id="pollDuration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="7">1 Week</SelectItem>
                      <SelectItem value="14">2 Weeks</SelectItem>
                      <SelectItem value="30">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multipleChoices"
                    checked={allowMultipleChoices}
                    onCheckedChange={(checked) => setAllowMultipleChoices(checked as boolean)}
                  />
                  <Label htmlFor="multipleChoices" className="text-sm font-normal">
                    Allow multiple choices
                  </Label>
                </div>

                {allowMultipleChoices && (
                  <div className="space-y-2">
                    <Label htmlFor="maxChoices">Maximum Choices</Label>
                    <Select 
                      value={maxChoices.toString()} 
                      onValueChange={(value) => setMaxChoices(parseInt(value))}
                    >
                      <SelectTrigger id="maxChoices">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} choices
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
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