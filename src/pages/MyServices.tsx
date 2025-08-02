import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ServicesList from '@/components/ServicesList';
import CreateServiceDialog from '@/components/CreateServiceDialog';

import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';

const MyServices = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
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


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-64 pb-16 md:pb-0">
        <div className="container px-3 sm:px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 md:mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 h-10 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold break-words">My Services</h1>
              <p className="text-sm md:text-base text-muted-foreground">Manage your service offerings</p>
            </div>
            
            <div className="w-full sm:w-auto">
              <CreateServiceDialog onServiceCreated={handleServiceCreated} />
            </div>
          </div>

          <ServicesList onRefresh={refreshTrigger} showOnlyServices={true} />
        </div>
      </main>
    </div>
  );
};

export default MyServices;