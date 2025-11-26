import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, ImagePlus } from '@/lib/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PostCardData } from '@/types/community';
import { useUpdatePost } from '@/hooks/useFeedQuery';
import { MediaUploader } from '@/components/MediaUploader';
import { useCloudinaryUpload, CloudinaryAttachment } from '@/hooks/useCloudinaryUpload';
import { useAuth } from '@/hooks/useAuth';
import { Users, Building, Home, Globe } from '@/lib/icons';

interface EditPostDialogProps {
  post: PostCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditPostDialog = ({ post, open, onOpenChange }: EditPostDialogProps) => {
  const [content, setContent] = useState(post.content);
  const [title, setTitle] = useState(post.title || '');
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [currentTag, setCurrentTag] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<CloudinaryAttachment[]>([]);
  const [locationScope, setLocationScope] = useState((post as any).location_scope || 'all');
  const [isMobile, setIsMobile] = useState(false);

  const { user } = useAuth();
  const updatePost = useUpdatePost();
  const { uploadMultipleFiles, uploading } = useCloudinaryUpload(user?.id || '', 'posts');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize media from post
  useEffect(() => {
    if (open) {
      const mediaItems: CloudinaryAttachment[] = [];
      
      // Add images
      if (post.image_urls) {
        post.image_urls.forEach((url, index) => {
          mediaItems.push({
            id: `existing-image-${index}`,
            url,
            type: 'image',
            name: `image-${index}`,
            size: 0,
            mimeType: 'image/jpeg',
          });
        });
      }
      
      // Add video
      if (post.video_url) {
        mediaItems.push({
          id: 'existing-video',
          url: post.video_url,
          type: 'video',
          thumbnailUrl: post.video_thumbnail_url || undefined,
          name: 'video',
          size: 0,
          mimeType: 'video/mp4',
        });
      }
      
      setUploadedMedia(mediaItems);
      setContent(post.content);
      setTitle(post.title || '');
      setTags(post.tags || []);
      setLocationScope((post as any).location_scope || 'all');
    }
  }, [open, post]);

  const handleMediaSelect = useCallback((files: File[]) => {
    const hasVideo = uploadedMedia.some(f => f.type === 'video');
    const newHasVideo = files.some(f => f.type.startsWith('video/'));
    
    if (hasVideo || newHasVideo) {
      uploadMultipleFiles(files.slice(0, 1)).then(attachments => {
        setUploadedMedia(attachments);
      });
    } else {
      const maxToAdd = 4 - uploadedMedia.length;
      uploadMultipleFiles(files.slice(0, maxToAdd)).then(attachments => {
        setUploadedMedia(prev => [...prev, ...attachments]);
      });
    }
  }, [uploadedMedia, uploadMultipleFiles]);

  const handleMediaRemove = useCallback((index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const imageUrls = uploadedMedia.filter(a => a.type === 'image').map(a => a.url);
    const videoAttachment = uploadedMedia.find(a => a.type === 'video');

    await updatePost.mutateAsync({
      id: post.id,
      content: content.trim(),
      title: title.trim() || null,
      image_urls: imageUrls,
      video_url: videoAttachment?.url || null,
      video_thumbnail_url: videoAttachment?.thumbnailUrl || null,
      tags,
      location_scope: locationScope,
    });

    onOpenChange(false);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {post.title && (
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[120px] resize-none"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Media</Label>
        <MediaUploader
          onFilesSelected={handleMediaSelect}
          uploadedFiles={uploadedMedia}
          onRemove={handleMediaRemove}
          uploading={uploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (max 5)</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyDown={handleTagKeyPress}
            placeholder="Add a tag..."
            disabled={tags.length >= 5}
          />
          <Button
            type="button"
            onClick={addTag}
            disabled={!currentTag.trim() || tags.length >= 5}
            variant="outline"
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility</Label>
        <Select value={locationScope} onValueChange={setLocationScope}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neighborhood">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Neighborhood</span>
              </div>
            </SelectItem>
            <SelectItem value="city">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>City</span>
              </div>
            </SelectItem>
            <SelectItem value="state">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>State</span>
              </div>
            </SelectItem>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Everyone</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={updatePost.isPending || !content.trim()}>
          {updatePost.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Post</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
