import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMinimalAuth as useAuth } from '@/hooks/useAuth-minimal';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import SettingsContent from '@/components/settings/SettingsContent';

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // In development mode, we allow mock user to access settings
    const isMockUser = user && user.id === 'mock-user-id';
    
    if (!loading && !user && !isMockUser) {
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

  // For development mode, we continue even with mock user
  const isMockUser = user && user.id === 'mock-user-id';
  if (!user && !isMockUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-64 pb-16 md:pb-0">
        <div className="container py-6 max-w-4xl">
          <SettingsContent />
        </div>
      </main>
    </div>
  );
};

export default Settings;