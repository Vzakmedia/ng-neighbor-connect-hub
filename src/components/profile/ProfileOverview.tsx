import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Edit, MapPin, Phone, Mail, User, Star, Camera, Save, X, Upload, Calendar, Shield, CheckCircle, Crop as CropIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { LocationSelector } from '@/components/auth/LocationSelector';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  neighborhood: string;
  state: string;
  city: string;
  avatar_url: string;
  bio: string;
  is_verified: boolean;
  created_at: string;
}

const ProfileOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    neighborhood: '',
    state: '',
    city: '',
    bio: ''
  });
  const [requestingVerification, setRequestingVerification] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address: data.address || '',
        neighborhood: data.neighborhood || '',
        state: data.state || '',
        city: data.city || '',
        bio: data.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (croppedImageBlob: Blob) => {
    if (!user) return;

    setUploading(true);
    try {
      const fileName = `${user.id}/avatar.jpg`;

      // Upload cropped image to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImageBlob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });

      fetchProfile();
      setShowCropper(false);
      setImageToCrop(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    );

    return new Promise((resolve) => {
      canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.9);
    });
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height,
      ),
      width,
      height,
    );
    
    setCrop(crop);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Create image URL for cropping
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      if (croppedImageBlob) {
        await handleAvatarUpload(croppedImageBlob);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: "Error",
        description: "Failed to crop image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const cancelEditing = () => {
    setEditing(false);
    // Reset form data to current profile values
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        neighborhood: profile.neighborhood || '',
        state: profile.state || '',
        city: profile.city || '',
        bio: profile.bio || ''
      });
    }
  };

  const handleVerificationRequest = async () => {
    if (!user || !profile) return;

    setRequestingVerification(true);
    try {
      // Here you would typically send a request to an admin system
      // For now, we'll just show a success message
      toast({
        title: "Verification Request Sent",
        description: "Your verification request has been submitted. You'll be notified once reviewed.",
      });
    } catch (error) {
      console.error('Error requesting verification:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRequestingVerification(false);
    }
  };

  const handleLocationChange = (state: string, city: string, neighborhood: string) => {
    setFormData(prev => ({ ...prev, state, city, neighborhood }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-muted h-24 w-24"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-32"></div>
                  <div className="h-4 bg-muted rounded w-24"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden space-y-4 sm:space-y-6">
      {/* Profile Header Card */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <User className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">My Profile</span>
            </CardTitle>
            {!editing ? (
              <Button variant="outline" onClick={() => setEditing(true)} className="w-full sm:w-auto">
                <Edit className="h-4 w-4 mr-2" />
                <span className="sm:inline">Edit Profile</span>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={cancelEditing} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-2" />
                  <span className="sm:inline">Cancel</span>
                </Button>
                <Button onClick={handleSubmit} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  <span className="sm:inline">Save</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="relative flex-shrink-0 mx-auto sm:mx-0">
              <OnlineAvatar
                userId={user?.id}
                src={profile?.avatar_url || undefined}
                fallback={profile?.full_name ? getInitials(profile.full_name) : 'U'}
                size="xl"
                showOnlineStatus={false}
              />
              {editing && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="flex-1 w-full space-y-3 sm:space-y-4">
              {/* Name Section */}
              <div className="text-center sm:text-left">
                {editing ? (
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="text-base sm:text-lg font-semibold w-full"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold truncate">
                      {profile?.full_name || 'No name set'}
                    </h2>
                    {profile?.is_verified && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 flex-shrink-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span className="text-xs">Verified</span>
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Bio Section */}
              <div>
                {editing ? (
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="resize-none w-full"
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm sm:text-base text-center sm:text-left">
                    {profile?.bio || 'No bio available'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Phone className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="w-full">
              {editing ? (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">{profile?.phone || 'No phone number'}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm sm:text-base truncate">{user?.email || 'No email'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Location Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {editing ? (
            <div className="lg:col-span-2 space-y-4">
              <Label className="text-sm">Location</Label>
              <LocationSelector 
                onLocationChange={handleLocationChange}
                defaultState={formData.state}
                defaultCity={formData.city}
                defaultNeighborhood={formData.neighborhood}
              />
            </div>
          ) : (
            <>
              <div className="w-full">
                <Label className="text-xs sm:text-sm text-muted-foreground">State</Label>
                <p className="font-medium text-sm sm:text-base truncate">{profile?.state || 'Not specified'}</p>
              </div>

              <div className="w-full">
                <Label className="text-xs sm:text-sm text-muted-foreground">City</Label>
                <p className="font-medium text-sm sm:text-base truncate">{profile?.city || 'Not specified'}</p>
              </div>

              <div className="w-full">
                <Label className="text-xs sm:text-sm text-muted-foreground">Neighborhood</Label>
                <p className="font-medium text-sm sm:text-base truncate">{profile?.neighborhood || 'Not specified'}</p>
              </div>
            </>
          )}

            <div className="w-full lg:col-span-2">
              {editing ? (
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm">Full Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your full address"
                    className="w-full"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Full Address</Label>
                  <p className="font-medium text-sm sm:text-base break-words">{profile?.address || 'Not specified'}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="w-full">
              <Label className="text-xs sm:text-sm text-muted-foreground">Member Since</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
                  {new Date(profile?.created_at || '').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="w-full">
              <Label className="text-xs sm:text-sm text-muted-foreground">Account Status</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                {profile?.is_verified ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="font-medium text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">Verified Account</span>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 flex-shrink-0 w-fit">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span className="text-xs">Verified</span>
                    </Badge>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="font-medium text-amber-700 dark:text-amber-400 text-sm sm:text-base">Unverified Account</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!profile?.is_verified && (
            <div className="pt-4 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm sm:text-base">Account Verification</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Get your account verified to build trust in the community
                  </p>
                </div>
                <Button 
                  onClick={handleVerificationRequest}
                  disabled={requestingVerification}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto flex-shrink-0"
                >
                  {requestingVerification ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-sm">{requestingVerification ? 'Requesting...' : 'Request Verification'}</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Cropper Dialog */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              Crop Profile Picture
            </DialogTitle>
          </DialogHeader>
          
          {imageToCrop && (
            <div className="flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageToCrop}
                  onLoad={onImageLoad}
                  className="max-h-96"
                />
              </ReactCrop>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCropper(false);
                setImageToCrop(null);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={!completedCrop || uploading}
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : 'Save Picture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileOverview;