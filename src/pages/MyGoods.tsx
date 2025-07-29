import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ServicesList from '@/components/ServicesList';
import CreateMarketplaceItemDialog from '@/components/CreateMarketplaceItemDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const MyGoods = () => {
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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/services')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">My Goods</h1>
                <p className="text-muted-foreground">Manage your marketplace items</p>
              </div>
            </div>
            <CreateMarketplaceItemDialog onItemCreated={handleItemCreated} />
          </div>

          <ServicesList onRefresh={refreshTrigger} showOnlyGoods={true} />
        </div>
      </main>
    </div>
  );
};

export default MyGoods;