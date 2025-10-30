import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SimpleLocationSelector } from "@/components/profile/SimpleLocationSelector";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, User, MapPin, Camera, Eye, EyeOff, Lock } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/security/PasswordStrengthIndicator";
import { validatePasswordStrength } from "@/utils/security";

export const EnhancedProfileCompletion = () => {
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    state: "",
    city: "",
    neighborhood: "",
    address: "",
    avatar_url: "",
    password: "",
    confirmPassword: ""
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is from Google OAuth (needs to set password)
  const isGoogleUser = user?.app_metadata?.provider === 'google';

  // Pre-fill data from Google AND stored location if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || prev.full_name,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || prev.avatar_url,
        // Pre-fill location from OAuth metadata if available
        state: user.user_metadata?.state || prev.state,
        city: user.user_metadata?.city || prev.city,
        neighborhood: user.user_metadata?.neighborhood || prev.neighborhood,
        address: user.user_metadata?.address || prev.address,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (state: string, city: string, neighborhood: string) => {
    setFormData(prev => ({
      ...prev,
      state,
      city,
      neighborhood
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingAvatar(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to avatars bucket
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Avatar Uploaded",
        description: "Your profile picture has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.state || !formData.city || !formData.neighborhood) {
      toast({
        title: "Location Required",
        description: "Please select your complete location (state, city, and neighborhood).",
        variant: "destructive",
      });
      return;
    }

    if (!formData.address.trim()) {
      toast({
        title: "Address Required",
        description: "Please provide your complete address.",
        variant: "destructive",
      });
      return;
    }

    // Validate password for Google users
    if (isGoogleUser) {
      if (!formData.password) {
        toast({
          title: "Password Required",
          description: "Please set a password for your account.",
          variant: "destructive",
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // If Google user, update their password
      if (isGoogleUser && formData.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (passwordError) {
          throw passwordError;
        }
      }

      // Get user email from auth
      const email = user?.email || '';

      // Create/update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          state: formData.state,
          city: formData.city,
          neighborhood: formData.neighborhood,
          address: formData.address.trim() || null,
          email: email,
          avatar_url: formData.avatar_url || null
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Completed!",
        description: "Welcome to NeighborLink! Your profile has been set up successfully.",
      });

      // Navigate to the main app
      navigate("/");
    } catch (error: any) {
      console.error('Error completing profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.full_name.trim() && 
                     formData.state && 
                     formData.city && 
                     formData.neighborhood &&
                     formData.address.trim() &&
                     (!isGoogleUser || (formData.password && formData.password === formData.confirmPassword));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          </div>
          <CardDescription>
            Please provide your details to finish setting up your account
            {isGoogleUser && " and set a password for additional security"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback>
                    {formData.full_name ? formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Click the camera icon to upload a profile picture
              </p>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Personal Information</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Your phone number (optional)"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Password Section for Google Users */}
            {isGoogleUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Set Account Password</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={isGoogleUser}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  {formData.password && <PasswordStrengthIndicator password={formData.password} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required={isGoogleUser}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Location Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Your Community Location <span className="text-destructive">*</span></h3>
              </div>
              
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md mb-3">
                <p className="text-xs text-muted-foreground">
                  This will be your permanent community location. All posts you create and see will be based on this location.
                </p>
              </div>
              
              <SimpleLocationSelector
                onLocationChange={handleLocationChange}
                defaultState={formData.state}
                defaultCity={formData.city}
                defaultNeighborhood={formData.neighborhood}
              />
              
              {formData.state && formData.city && formData.neighborhood && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs font-medium mb-1">You'll join the community in:</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.neighborhood}, {formData.city}, {formData.state}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="address">Complete Address <span className="text-destructive">*</span></Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Enter your complete street address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up your profile...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};