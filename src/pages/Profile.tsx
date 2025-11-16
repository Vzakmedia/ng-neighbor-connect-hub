import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useIsMobile } from '@/hooks/use-mobile';
import Navigation from '@/components/Navigation';
import ProfileOverview from '@/components/profile/ProfileOverview';
import ActivityHistory from '@/components/profile/ActivityHistory';
import { ProfileCompletionCard } from '@/components/profile/ProfileCompletionCard';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const completionStatus = useProfileCompletion(profile);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
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
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <main className="pb-20 md:pb-4">
        <div className="container py-6 max-w-4xl">
          <div className="space-y-6">
            {!completionStatus.isComplete && !isMobile && (
              <ProfileCompletionCard 
                completionStatus={completionStatus}
                onEditProfile={() => navigate('/complete-profile')}
              />
            )}
            <ProfileOverview />
            <ActivityHistory />
          </div>
        </div>
      </main>

      <Navigation />
    </div>
  );
};

export default Profile;