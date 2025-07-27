import { useState } from 'react';
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

interface CreateServiceDialogProps {
  onServiceCreated: () => void;
}

const CreateServiceDialog = ({ onServiceCreated }: CreateServiceDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<Array<{
    date: string;
    startTime: string;
    endTime: string;
    maxBookings: number;
  }>>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price_min: '',
    price_max: '',
    location: '',
    is_active: true
  });

  const categories = [
    'home_repair', 'tutoring', 'pet_sitting', 'cleaning', 'gardening', 
    'tech_support', 'cooking', 'transport', 'fitness', 'beauty', 'other'
  ];

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !user) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('service-galleries')
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
        description: `${newImageUrls.length} image(s) added to gallery`,
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
        description: "Image deleted from gallery",
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

  const addAvailabilitySlot = () => {
    const today = new Date().toISOString().split('T')[0];
    setAvailabilitySlots(prev => [...prev, {
      date: today,
      startTime: '09:00',
      endTime: '17:00',
      maxBookings: 1
    }]);
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateAvailabilitySlot = (index: number, field: string, value: string | number) => {
    setAvailabilitySlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category as any,
          price_min: formData.price_min ? parseInt(formData.price_min) : null,
          price_max: formData.price_max ? parseInt(formData.price_max) : null,
          location: formData.location,
          is_active: formData.is_active,
          images: galleryImages
        })
        .select()
        .single();

      if (serviceError) throw serviceError;

      // Create availability slots if any
      if (availabilitySlots.length > 0 && serviceData) {
        const availabilityData = availabilitySlots.map(slot => ({
          service_id: serviceData.id,
          user_id: user.id,
          date: slot.date,
          start_time: slot.startTime,
          end_time: slot.endTime,
          max_bookings: slot.maxBookings,
          is_available: true
        }));

        const { error: availabilityError } = await supabase
          .from('service_availability')
          .insert(availabilityData);

        if (availabilityError) {
          console.error('Error creating availability:', availabilityError);
          // Don't fail the whole operation if availability fails
        }
      }

      toast({
        title: "Service created",
        description: "Your service has been successfully created",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        price_min: '',
        price_max: '',
        location: '',
        is_active: true
      });
      setGalleryImages([]);
      setAvailabilitySlots([]);
      setOpen(false);
      onServiceCreated();
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Offer Service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., House Cleaning Service"
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
              placeholder="Describe your service in detail..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_min">Min Price (₦)</Label>
              <Input
                id="price_min"
                type="number"
                value={formData.price_min}
                onChange={(e) => setFormData(prev => ({ ...prev, price_min: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_max">Max Price (₦)</Label>
              <Input
                id="price_max"
                type="number"
                value={formData.price_max}
                onChange={(e) => setFormData(prev => ({ ...prev, price_max: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Service area/location"
            />
          </div>

          {/* Gallery Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Service Gallery</Label>
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
                        alt={`Gallery image ${index + 1}`}
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
              Add up to 8 photos to showcase your service. JPG, PNG formats supported.
            </p>
          </div>

          {/* Availability Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Service Availability</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAvailabilitySlot}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Time Slot
              </Button>
            </div>

            {availabilitySlots.map((slot, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={slot.date}
                        onChange={(e) => updateAvailabilitySlot(index, 'date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateAvailabilitySlot(index, 'startTime', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateAvailabilitySlot(index, 'endTime', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Bookings</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={slot.maxBookings}
                          onChange={(e) => updateAvailabilitySlot(index, 'maxBookings', parseInt(e.target.value) || 1)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAvailabilitySlot(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {availabilitySlots.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No availability set. Add time slots to let customers know when your service is available.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Service Available</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Service'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateServiceDialog;