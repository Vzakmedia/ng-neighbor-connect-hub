import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedProfileCompletion } from "@/components/auth/EnhancedProfileCompletion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@/lib/icons";

const CompleteProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      checkUserProfile();
    }
  }, [user, authLoading, navigate]);

  const checkUserProfile = async () => {
    console.log('Checking profile for user:', user?.id);
    console.log('User metadata:', user?.user_metadata);
    console.log('App metadata:', user?.app_metadata);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, state, city, neighborhood, full_name, address')
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log('Profile check result:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error);
      }

      // Check if user has complete profile information
      const hasCompleteProfile = data && 
        data.state && 
        data.city && 
        data.neighborhood &&
        data.full_name && 
        data.address;
      
      console.log('Has complete profile:', hasCompleteProfile);
      
      if (hasCompleteProfile) {
        setHasProfile(true);
        navigate("/");
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setCheckingProfile(false);
    }
  };

  if (authLoading || checkingProfile) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  if (hasProfile) {
    return null;
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
      <EnhancedProfileCompletion />
    </div>
  );
};

export default CompleteProfile;