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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [weeklyAvailability, setWeeklyAvailability] = useState<Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    max_bookings: number;
  }>>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price_min: '',
    price_max: '',
    price_type: 'hourly',
    location: '',
    is_active: true
  });

  const DAYS_OF_WEEK = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
  ];

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

  const handleDayToggle = (dayOfWeek: number, checked: boolean) => {
    if (checked) {
      // Add default availability for this day
      const newAvailability = {
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '17:00',
        max_bookings: 1,
      };
      setWeeklyAvailability(prev => [...prev, newAvailability]);
    } else {
      // Remove availability for this day
      setWeeklyAvailability(prev => prev.filter(item => item.day_of_week !== dayOfWeek));
    }
  };

  const updateAvailability = (dayOfWeek: number, field: string, value: any) => {
    setWeeklyAvailability(prev => 
      prev.map(item => 
        item.day_of_week === dayOfWeek 
          ? { ...item, [field]: value }
          : item
      )
    );
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
          price_type: formData.price_type,
          location: formData.location,
          is_active: formData.is_active,
          images: galleryImages
        })
        .select()
        .single();

      if (serviceError) throw serviceError;

      // Create weekly availability if any
      if (weeklyAvailability.length > 0 && serviceData) {
        const availabilityData = weeklyAvailability.map(slot => ({
          service_id: serviceData.id,
          user_id: user.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          max_bookings: slot.max_bookings,
          is_available: true
        }));

        const { error: availabilityError } = await supabase
          .from('service_weekly_availability')
          .insert(availabilityData);

        if (availabilityError) {
          console.error('Error creating weekly availability:', availabilityError);
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
        price_type: 'hourly',
        location: '',
        is_active: true
      });
      setGalleryImages([]);
      setWeeklyAvailability([]);
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
            <div className="space-y-2">
              <Label htmlFor="price_type">Pricing Type</Label>
              <Select
                value={formData.price_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, price_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Per Hour</SelectItem>
                  <SelectItem value="daily">Per Day</SelectItem>
                  <SelectItem value="weekly">Per Week</SelectItem>
                  <SelectItem value="monthly">Per Month</SelectItem>
                  <SelectItem value="project">Per Project</SelectItem>
                  <SelectItem value="fixed">Fixed Rate</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Weekly Availability Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Weekly Availability</Label>
              <p className="text-sm text-muted-foreground">
                Set your weekly schedule
              </p>
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const dayAvailability = weeklyAvailability.find(item => item.day_of_week === day.value);
                const isSelected = !!dayAvailability;
                
                return (
                  <div key={day.value} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="font-medium">
                        {day.label}
                      </Label>
                    </div>
                    
                    {isSelected && dayAvailability && (
                      <div className="ml-6 grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            value={dayAvailability.start_time}
                            onChange={(e) => updateAvailability(day.value, 'start_time', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            value={dayAvailability.end_time}
                            onChange={(e) => updateAvailability(day.value, 'end_time', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Max Bookings</Label>
                          <Input
                            type="number"
                            min="1"
                            value={dayAvailability.max_bookings}
                            onChange={(e) => updateAvailability(day.value, 'max_bookings', parseInt(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {weeklyAvailability.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No availability set. Select days to let customers know when your service is available.
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