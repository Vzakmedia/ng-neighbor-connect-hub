import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedProfileCompletion } from "@/components/auth/EnhancedProfileCompletion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Complete Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <EnhancedProfileCompletion />
    </div>
  );
};

export default CompleteProfile;