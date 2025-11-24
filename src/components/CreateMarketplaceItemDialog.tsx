import { useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MediaUploader } from '@/components/MediaUploader';
import { PlusIcon } from '@heroicons/react/24/outline';

interface CreateMarketplaceItemDialogProps {
  onItemCreated: () => void;
  trigger?: ReactNode;
}

const CreateMarketplaceItemDialog = ({ onItemCreated, trigger }: CreateMarketplaceItemDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadMultipleFiles, uploading, progress } = useCloudinaryUpload(user?.id || '', 'marketplace-items');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    location: '',
    condition: '',
    is_negotiable: false
  });

  const categories = [
    'electronics', 'furniture', 'vehicles', 'clothing', 'books', 
    'toys', 'sports', 'home_garden', 'jewelry', 'other'
  ];

  const conditions = [
    'new', 'like_new', 'good', 'fair', 'poor'
  ];

  const handleMediaUpload = async (files: File[]) => {
    if (!user) return;

    const attachments = await uploadMultipleFiles(files);
    if (attachments.length > 0) {
      setGalleryFiles(prev => [...prev, ...attachments]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Show optimistic success
    toast({
      title: "Creating listing...",
      description: "Your item is being listed",
    });

    // Save form state and reset immediately
    const savedFormData = { ...formData };
    const savedFiles = [...galleryFiles];
    setFormData({
      title: '',
      description: '',
      category: '',
      price: '',
      location: '',
      condition: '',
      is_negotiable: false
    });
    setGalleryFiles([]);
    setOpen(false);
    onItemCreated();

    setLoading(true);
    try {
      const imageUrls = savedFiles.filter(f => f.type === 'image').map(f => f.url);
      const videoUrls = savedFiles.filter(f => f.type === 'video').map(f => f.url);

      const { error } = await supabase
        .from('marketplace_items')
        .insert({
          user_id: user.id,
          title: savedFormData.title,
          description: savedFormData.description,
          category: savedFormData.category as any,
          price: parseInt(savedFormData.price),
          location: savedFormData.location,
          condition: savedFormData.condition,
          is_negotiable: savedFormData.is_negotiable,
          images: imageUrls,
          video_urls: videoUrls,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Item listed",
        description: "Your item has been successfully listed",
      });
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive",
      });
      // Restore form on error
      setFormData(savedFormData);
      setGalleryFiles(savedFiles);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            List Goods
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Listing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Item Title*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., iPhone 13 Pro Max"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category*</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your item in detail..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦)*</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition*</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Item location"
              />
            </div>
          </div>

          {/* Media Gallery Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Item Gallery (Images & Videos)</Label>
            <MediaUploader
              onFilesSelected={handleMediaUpload}
              accept="both"
              maxFiles={8}
              uploadedFiles={galleryFiles}
              onRemove={handleRemoveMedia}
              uploading={uploading}
              progress={progress}
            />
            <p className="text-xs text-muted-foreground">
              Add up to 8 media files (images or videos) to showcase your item
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_negotiable"
              checked={formData.is_negotiable}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_negotiable: checked }))}
            />
            <Label htmlFor="is_negotiable">Price Negotiable</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || uploading} className="flex-1">
              {loading ? 'Creating...' : 'Create Listing'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading || uploading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMarketplaceItemDialog;