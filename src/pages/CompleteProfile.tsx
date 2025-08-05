import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileCompletion } from "@/components/auth/ProfileCompletion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, state, city, neighborhood')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error);
      }

      // Check if user has complete location information
      const hasCompleteProfile = data && data.state && data.city && data.neighborhood;
      
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

  return <ProfileCompletion />;
};

export default CompleteProfile;