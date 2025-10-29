import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, User, Loader2, Mail } from "lucide-react";
import { SimpleLocationSelector } from "@/components/profile/SimpleLocationSelector";
import { SecureInput } from "./SecureAuthForms";
import { PasswordStrengthIndicator } from "@/components/security/PasswordStrengthIndicator";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { validateEmail, validatePhoneNumber, sanitizeText, validatePasswordStrength } from "@/utils/security";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { useRef, useState as useSignupState } from "react";
import { AvatarCropper } from "./AvatarCropper";
import { ConsentDialog, ConsentState } from "../legal/ConsentDialog";
import { Capacitor } from '@capacitor/core';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const SignUpForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    state: "",
    city: "",
    neighborhood: "",
    address: "",
    avatarUrl: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useSignupState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [userConsents, setUserConsents] = useState<ConsentState | null>(null);
  const [showEmailSentDialog, setShowEmailSentDialog] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (state: string, city: string, neighborhood: string) => {
    setFormData(prev => ({ ...prev, state, city, neighborhood }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Create preview URL and open cropper
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageSrc(imageUrl);
    setCropperOpen(true);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      setUploadingAvatar(true);
      console.log('Starting avatar upload...');

      // Generate unique filename
      const fileName = `temp-${Date.now()}.jpeg`;
      const filePath = `profile-pictures/${fileName}`;
      
      console.log('Upload path:', filePath);
      console.log('Cropped file size:', croppedImageBlob.size);
      console.log('Cropped file type:', croppedImageBlob.type);

      // Upload cropped image to avatars bucket
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedImageBlob);

      console.log('Upload response:', { data, error });

      if (error) {
        console.error('Upload error details:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));

      toast({
        title: "Avatar Uploaded",
        description: "Your profile picture has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Clean up the object URL
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc);
        setSelectedImageSrc('');
      }
    }
  };

  const handleConsentGiven = (consents: ConsentState) => {
    setUserConsents(consents);
    setShowConsentDialog(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First, validate basic form data
    if (!userConsents) {
      setShowConsentDialog(true);
      return;
    }
    
    // Validate required location fields
    if (!formData.state) {
      toast({
        title: "State Required",
        description: "Please select your state to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.city) {
      toast({
        title: "City Required",
        description: "Please select your city to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.neighborhood) {
      toast({
        title: "Neighborhood Required",
        description: "Please select your neighborhood to continue.",
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
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Redirect to verification page for both web and native
      const redirectUrl = Capacitor.isNativePlatform() 
        ? 'neighborlink://auth/verify-email'
        : `${window.location.origin}/auth/verify-email`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            state: formData.state,
            city: formData.city,
            neighborhood: formData.neighborhood,
            address: formData.address,
            avatar_url: formData.avatarUrl,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else if (data.user) {
        // Store consent record
        try {
          await supabase.from('user_consents').insert({
            user_id: data.user.id,
            terms_accepted: userConsents.termsAccepted,
            privacy_accepted: userConsents.privacyAccepted,
            data_processing_accepted: userConsents.dataProcessingAccepted,
            location_sharing_accepted: userConsents.locationSharingAccepted,
            communication_accepted: userConsents.communicationAccepted,
            
            // Device Permissions
            camera_access_accepted: userConsents.cameraAccessAccepted,
            microphone_access_accepted: userConsents.microphoneAccessAccepted,
            push_notifications_accepted: userConsents.pushNotificationsAccepted,
            file_access_accepted: userConsents.fileAccessAccepted,
            
            // Security & Analytics
            device_storage_accepted: userConsents.deviceStorageAccepted,
            analytics_accepted: userConsents.analyticsAccepted,
            crash_reporting_accepted: userConsents.crashReportingAccepted,
            
            // Enhanced Location
            precise_location_accepted: userConsents.preciseLocationAccepted,
            background_location_accepted: userConsents.backgroundLocationAccepted,
            location_history_accepted: userConsents.locationHistoryAccepted,
            
            // Advanced Features
            voice_video_calls_accepted: userConsents.voiceVideoCallsAccepted,
            emergency_contacts_accepted: userConsents.emergencyContactsAccepted,
            external_integrations_accepted: userConsents.externalIntegrationsAccepted,
            
            // Commercial/Business
            marketplace_transactions_accepted: userConsents.marketplaceTransactionsAccepted,
            business_verification_accepted: userConsents.businessVerificationAccepted,
            payment_processing_accepted: userConsents.paymentProcessingAccepted,
            
            // Content & AI
            content_processing_accepted: userConsents.contentProcessingAccepted,
            content_moderation_accepted: userConsents.contentModerationAccepted,
            recommendations_accepted: userConsents.recommendationsAccepted,
            
            // Third-Party Integration
            google_services_accepted: userConsents.googleServicesAccepted,
            external_apis_accepted: userConsents.externalApisAccepted,
            cross_platform_sync_accepted: userConsents.crossPlatformSyncAccepted,
            
            ip_address: null, // Could be captured server-side
            user_agent: navigator.userAgent,
            consent_version: '2.0'
          });
        } catch (consentError) {
          console.error('Failed to store consent record:', consentError);
          // Don't block signup for this, but log the error
        }

        // Show prominent email sent dialog instead of toast
        setSignupEmail(formData.email);
        setShowEmailSentDialog(true);
      }
    } catch (error) {
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSignUp} className="space-y-4">
      {/* Profile Picture Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={formData.avatarUrl} />
            <AvatarFallback>
              {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-8 w-8" />}
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
          Upload a profile picture (optional)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
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
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleInputChange}
        />
      </div>

      <SimpleLocationSelector 
        onLocationChange={handleLocationChange}
        defaultState={formData.state}
        defaultCity={formData.city}
        defaultNeighborhood={formData.neighborhood}
      />

      <div className="space-y-2">
        <Label htmlFor="address">Complete Address <span className="text-destructive">*</span></Label>
        <Input
          id="address"
          name="address"
          type="text"
          placeholder="Enter your complete address (street number, street name, etc.)"
          value={formData.address}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={formData.password}
            onChange={handleInputChange}
            required
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
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
    </form>

    {/* OR Divider */}
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          Or continue with
        </span>
      </div>
    </div>

    {/* Google Sign-up Button */}
    <GoogleAuthButton mode="signup" />

    {/* Consent Dialog */}
    <ConsentDialog
      open={showConsentDialog}
      onConsentGiven={handleConsentGiven}
      onCancel={() => setShowConsentDialog(false)}
    />

    {/* Avatar Cropper Dialog */}
    <AvatarCropper
      isOpen={cropperOpen}
      onClose={() => {
        setCropperOpen(false);
        if (selectedImageSrc) {
          URL.revokeObjectURL(selectedImageSrc);
          setSelectedImageSrc('');
        }
      }}
      imageSrc={selectedImageSrc}
      onCropComplete={handleCropComplete}
    />

    {/* Email Sent Dialog */}
    <AlertDialog open={showEmailSentDialog} onOpenChange={setShowEmailSentDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">Check Your Email!</AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>We've sent a confirmation link to:</p>
            <p className="font-semibold text-foreground">{signupEmail}</p>
            <p className="mt-4">Please check your inbox (and spam folder) and click the link to verify your account.</p>
            <p className="text-xs text-muted-foreground mt-4">
              Didn't receive it? You can resend the email from the verification page.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="w-full">Got it!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
};