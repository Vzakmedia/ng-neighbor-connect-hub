import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ServicesList from '@/components/ServicesList';
import CreateServiceDialog from '@/components/CreateServiceDialog';
import CreateMarketplaceItemDialog from '@/components/CreateMarketplaceItemDialog';

const MyServices = () => {
  const { user, loading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleServiceCreated = () => {
    setRefreshTrigger(prev => !prev);
  };

  const handleItemCreated = () => {
    setRefreshTrigger(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-64 pb-16 md:pb-0">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Services</h1>
              <p className="text-muted-foreground">Manage your service offerings</p>
            </div>
            <div className="flex gap-2">
              <CreateServiceDialog onServiceCreated={handleServiceCreated} />
              <CreateMarketplaceItemDialog onItemCreated={handleItemCreated} />
            </div>
          </div>

          <ServicesList onRefresh={refreshTrigger} />
        </div>
      </main>
    </div>
  );
};

export default MyServices;