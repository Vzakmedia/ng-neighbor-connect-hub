import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Users } from '@/lib/icons';
import EventFeed from '@/components/EventFeed';
import CreateEventDialog from '@/components/CreateEventDialog';
import MyEventsPanel from '@/components/MyEventsPanel';
import { AdDisplay } from '@/components/advertising/display/AdDisplay';

const Events = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
      <Navigation />
      
      <main className="md:ml-16 lg:ml-64 pb-16 md:pb-0">
        <div className="container py-4 md:py-6 px-3 md:px-6">
          <Tabs defaultValue="all" className="w-full">
            {/* Desktop tabs with Create Event button */}
            <div className="hidden md:flex items-center justify-between mb-4">
              <TabsList className="flex justify-start">
                <TabsTrigger value="all">All Events</TabsTrigger>
                <TabsTrigger value="my-events">My Events</TabsTrigger>
              </TabsList>
              
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="touch-manipulation min-h-[44px] text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
            
            {/* Mobile tabs */}
            <div className="md:hidden flex items-center justify-between gap-2 mb-6">
              <TabsList className="flex">
                <TabsTrigger value="all">All Events</TabsTrigger>
                <TabsTrigger value="my-events">My Events</TabsTrigger>
              </TabsList>
              
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="touch-manipulation min-h-[44px] text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
            
            <TabsContent value="all" className="space-y-6">
              <EventFeed key={refreshKey} />
              <AdDisplay placement="inline" maxAds={2} />
            </TabsContent>
            
            <TabsContent value="my-events">
              <MyEventsPanel />
            </TabsContent>
          </Tabs>
          
          <CreateEventDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onEventCreated={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </main>
    </div>
  );
};

export default Events;