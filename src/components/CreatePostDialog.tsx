import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  AlertTriangle,
  ShoppingCart,
  Users,
  Calendar,
  MapPin,
  ImagePlus,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePostDialog = ({ open, onOpenChange }: CreatePostDialogProps) => {
  const [postType, setPostType] = useState<string>('general');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const postTypes = [
    { value: 'general', label: 'General Update', icon: Users, color: 'text-muted-foreground' },
    { value: 'safety', label: 'Safety Alert', icon: AlertTriangle, color: 'text-destructive' },
    { value: 'marketplace', label: 'Marketplace Item', icon: ShoppingCart, color: 'text-community-green' },
    { value: 'help', label: 'Need Help', icon: Users, color: 'text-community-blue' },
    { value: 'event', label: 'Community Event', icon: Calendar, color: 'text-community-yellow' },
  ];

  const getCurrentPostType = () => postTypes.find(type => type.value === postType)!;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles].slice(0, 4)); // Max 4 images
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      // Here you would normally submit to your backend/database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Post created successfully!",
        description: "Your post has been shared with the community.",
      });

      // Reset form
      setContent('');
      setTitle('');
      setLocation('');
      setImages([]);
      setPostType('general');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error creating post",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>YN</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">Your Name</p>
              <p className="text-sm text-muted-foreground">Victoria Island</p>
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

          {/* Location */}
          <div className="space-y-2">
            <Label>Location (Optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add specific location..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Images (Optional)</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSubmitting ? 'Posting...' : 'Post to Community'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;