import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleLocationSelector } from "@/components/profile/SimpleLocationSelector";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, User, MapPin } from '@/lib/icons';

export const ProfileCompletion = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    state: "",
    city: "",
    neighborhood: "",
    address: ""
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

    setLoading(true);

    try {
      // Get user email from auth
      const email = user?.email || '';

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
          email: email
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
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.full_name.trim() && formData.state && formData.city && formData.neighborhood;

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
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Location Information */}
            <div className="space-y-4">
              <SimpleLocationSelector
                onLocationChange={handleLocationChange}
                defaultState={formData.state}
                defaultCity={formData.city}
                defaultNeighborhood={formData.neighborhood}
              />
              
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Your street address (optional)"
                  value={formData.address}
                  onChange={handleInputChange}
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