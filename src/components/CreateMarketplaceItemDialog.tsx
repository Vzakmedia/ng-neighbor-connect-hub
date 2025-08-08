import { useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Camera, X } from 'lucide-react';

interface CreateMarketplaceItemDialogProps {
  onItemCreated: () => void;
  trigger?: ReactNode;
}

const CreateMarketplaceItemDialog = ({ onItemCreated, trigger }: CreateMarketplaceItemDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
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

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !user) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('service-galleries') // Reusing the same bucket
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('service-galleries')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const newImageUrls = await Promise.all(uploadPromises);
      setGalleryImages(prev => [...prev, ...newImageUrls]);

      toast({
        title: "Images uploaded",
        description: `${newImageUrls.length} image(s) added to listing`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;

      await supabase.storage
        .from('service-galleries')
        .remove([filePath]);

      setGalleryImages(prev => prev.filter((_, i) => i !== index));

      toast({
        title: "Image removed",
        description: "Image deleted from listing",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category as any,
          price: parseInt(formData.price) * 100, // Convert to cents
          location: formData.location,
          condition: formData.condition,
          is_negotiable: formData.is_negotiable,
          images: galleryImages,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Item listed",
        description: "Your item has been successfully listed",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        location: '',
        condition: '',
        is_negotiable: false
      });
      setGalleryImages([]);
      setOpen(false);
      onItemCreated();
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive",
      });
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
            <Plus className="h-4 w-4 mr-2" />
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

          {/* Gallery Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Item Gallery</Label>
              <div className="flex gap-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="gallery-upload"
                  disabled={uploadingImages}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('gallery-upload')?.click()}
                  disabled={uploadingImages}
                  className="flex items-center gap-2"
                >
                  {uploadingImages ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Images
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Image Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryImages.map((imageUrl, index) => (
                <Card key={index} className="relative group">
                  <CardContent className="p-2">
                    <div className="relative aspect-square">
                      <img
                        src={imageUrl}
                        alt={`Item gallery ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(imageUrl, index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Upload placeholder */}
              {galleryImages.length < 8 && (
                <Card className="cursor-pointer border-dashed hover:bg-muted/50">
                  <CardContent className="p-2">
                    <div 
                      className="aspect-square flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => document.getElementById('gallery-upload')?.click()}
                    >
                      <Camera className="h-8 w-8 mb-2" />
                      <span className="text-xs text-center">Add Photo</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Add up to 8 photos to showcase your item. JPG, PNG formats supported.
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
            <Button type="submit" disabled={loading || uploadingImages} className="flex-1">
              {loading ? 'Creating...' : 'Create Listing'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading || uploadingImages}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMarketplaceItemDialog;