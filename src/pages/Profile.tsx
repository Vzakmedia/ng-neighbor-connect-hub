import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ProfileOverview from '@/components/profile/ProfileOverview';
import ActivityHistory from '@/components/profile/ActivityHistory';
import { ProfileCompletionCard } from '@/components/profile/ProfileCompletionCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from '@/lib/icons';

const Profile = () => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const completionStatus = useProfileCompletion(profile);
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
      <Header />
      
      <main className="md:ml-16 lg:ml-64 pt-14 pb-20 md:pb-4">
        <div className="container py-6 max-w-4xl">
          <div className="mb-6">
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
          
          <div className="space-y-6">
            {!completionStatus.isComplete && (
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