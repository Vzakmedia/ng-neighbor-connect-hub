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
        navigate("/", { replace: true });
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Profile Already Complete!</h2>
          <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate('/profile-menu')}
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